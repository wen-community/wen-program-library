use std::str::FromStr;

use anchor_lang::{
    prelude::*,
    solana_program::{entrypoint::ProgramResult, program::invoke},
};

use crate::errors::MetadataErrors;
use crate::utils::update_account_lamports_to_minimum_balance;
use crate::{EditionsDeployment, UpdateRoyaltiesArgs, ROYALTY_BASIS_POINTS_FIELD};
use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::{BaseStateWithExtensions, StateWithExtensions},
        state::Mint as BaseStateMint,
    },
    spl_token_metadata_interface::instruction::remove_key,
    spl_token_metadata_interface::state::Field,
    spl_token_metadata_interface::state::TokenMetadata,
    token_metadata_update_field, Mint, Token2022, TokenMetadataUpdateField,
};
use solana_program::program::invoke_signed;

#[derive(Accounts)]
#[instruction(args: UpdateRoyaltiesArgs)]
pub struct ModifyRoyalties<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut,
        seeds = ["editions_deployment".as_ref(), editions_deployment.symbol.as_ref()], bump)]
    pub editions_deployment: Account<'info, EditionsDeployment>,
    #[account(mut,
        constraint = signer.key() == editions_deployment.creator)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> ModifyRoyalties<'info> {
    fn update_token_metadata_field(
        &self,
        field: Field,
        value: String,
        bump_edition: u8,
    ) -> ProgramResult {
        let deployment_seeds: &[&[u8]] = &[
            "editions_deployment".as_bytes(),
            self.editions_deployment.symbol.as_ref(),
            &[bump_edition],
        ];
        let signer_seeds: &[&[&[u8]]] = &[deployment_seeds];

        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info().clone(),
            update_authority: self.editions_deployment.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token_metadata_update_field(cpi_ctx, field, value)?;
        Ok(())
    }

    // ToDo: Create a macro for it
    fn remove_token_metadata_field(&self, field: &str, bump_edition: u8) -> Result<()> {
        let deployment_seeds: &[&[u8]] = &[
            "editions_deployment".as_bytes(),
            self.editions_deployment.symbol.as_ref(),
            &[bump_edition],
        ];
        let signer_seeds: &[&[&[u8]]] = &[deployment_seeds];
        invoke_signed(
            &remove_key(
                &self.token_program.key(),
                &self.mint.key(),
                &self.editions_deployment.key(),
                field.to_string(),
                false,
            ),
            &[
                self.mint.to_account_info(),
                self.editions_deployment.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }
}

pub fn handler(ctx: Context<ModifyRoyalties>, args: UpdateRoyaltiesArgs) -> Result<()> {
    // Log start of handler execution
    msg!("royalties::handler::start");

    // Log fetching metadata from mint account
    msg!("royalties::handler::fetch_metadata");
    let metadata = {
        let mint_account = ctx.accounts.mint.to_account_info().clone();
        let mint_account_data = mint_account.try_borrow_data()?;
        let mint_data = StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
        mint_data.get_variable_len_extension::<TokenMetadata>()?
    };

    // Log validation of royalty basis points
    msg!("royalties::handler::validate_royalty_basis_points");
    require!(
        args.royalty_basis_points <= 10000,
        MetadataErrors::RoyaltyBasisPointsInvalid
    );

    // Log updating the token metadata field for royalty basis points
    msg!(
        "royalties::handler::update_royalty_basis_points: {}",
        args.royalty_basis_points
    );
    ctx.accounts.update_token_metadata_field(
        Field::Key(ROYALTY_BASIS_POINTS_FIELD.to_owned()),
        args.royalty_basis_points.to_string(),
        ctx.bumps.editions_deployment,
    )?;

    let mut total_share: u8 = 0;

    // Log iterating over creators to update their metadata
    msg!("royalties::handler::update_creators_metadata");
    for creator in args.creators.clone() {
        // Log the creator's address and share
        msg!(
            "royalties::handler::creator: address={}, share={}",
            creator.address,
            creator.share
        );

        total_share = total_share
            .checked_add(creator.share)
            .ok_or(MetadataErrors::CreatorShareInvalid)?;

        // Log updating creator metadata field
        msg!(
            "royalties::handler::update_creator_field: address={}, share={}",
            creator.address,
            creator.share
        );
        ctx.accounts.update_token_metadata_field(
            Field::Key(creator.address.to_string()),
            creator.share.to_string(),
            ctx.bumps.editions_deployment,
        )?;
    }

    // Log validation of total share
    msg!("royalties::handler::validate_total_share: {}", total_share);
    if total_share != 100 {
        return Err(MetadataErrors::CreatorShareInvalid.into());
    }

    // Log filtering metadata to remove fields not in args
    msg!("royalties::handler::remove_unused_metadata");
    let creators = args.creators;
    let creators_additional_metadata: Vec<&(String, String)> = metadata
        .additional_metadata
        .iter()
        .filter(|(key, _)| !key.starts_with("royalty"))
        .collect();

    for (key, _) in creators_additional_metadata {
        match Pubkey::from_str(key) {
            Ok(parsed_key) => {
                if !creators.iter().any(|creator| creator.address == parsed_key) {
                    // Log removal of old metadata field
                    msg!("royalties::handler::remove_field: {}", key);
                    ctx.accounts
                        .remove_token_metadata_field(key, ctx.bumps.editions_deployment)?;
                }
            }
            Err(_) => {
                // Key is not a valid Pubkey, remove it or handle accordingly
                msg!("royalties::handler::invalid_key_not_a_pubkey: {}", key);
            }
        }
    }

    // Log updating account lamports to minimum balance
    msg!("royalties::handler::update_account_lamports");
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    // Log successful completion of the handler
    msg!("royalties::handler::success");

    Ok(())
}
