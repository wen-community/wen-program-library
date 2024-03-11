use std::str::FromStr;

use anchor_lang::{
    prelude::*,
    solana_program::{entrypoint::ProgramResult, program::invoke},
};

use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::{BaseStateWithExtensions, StateWithExtensions},
        state::Mint as BaseStateMint,
    },
    spl_token_metadata_interface::state::Field,
    spl_token_metadata_interface::state::TokenMetadata,
    token_metadata_update_field, Mint, Token2022, TokenMetadataUpdateField,
};

use crate::{
    update_account_lamports_to_minimum_balance, MetadataErrors, UpdateRoyaltiesArgs,
    ROYALTY_BASIS_POINTS_FIELD,
};

use spl_token_metadata_interface::instruction::remove_key;

#[derive(Accounts)]
#[instruction(args: UpdateRoyaltiesArgs)]
pub struct ModifyRoyalties<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> ModifyRoyalties<'info> {
    fn update_token_metadata_field(&self, field: Field, value: String) -> ProgramResult {
        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info().clone(),
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_update_field(cpi_ctx, field, value)?;
        Ok(())
    }

    // ToDo: Create a macro for it
    fn remove_token_metadata_field(&self, field: String) -> Result<()> {
        invoke(
            &remove_key(
                &self.token_program.key(),
                &self.mint.key(),
                &self.authority.key(),
                field,
                false,
            ),
            &[
                self.mint.to_account_info(),
                self.authority.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

pub fn handler(ctx: Context<ModifyRoyalties>, args: UpdateRoyaltiesArgs) -> Result<()> {
    let mint_account = ctx.accounts.mint.to_account_info().clone();
    let mint_account_data = mint_account.try_borrow_mut_data()?;
    let mint_data = StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;

    // validate that the fee_basis_point is less than 10000 (100%)
    require!(
        args.royalty_basis_points <= 10000,
        MetadataErrors::RoyaltyBasisPointsInvalid
    );

    // since this field is already there, it will just update it with the new value if there is one
    ctx.accounts.update_token_metadata_field(
        Field::Key(ROYALTY_BASIS_POINTS_FIELD.to_owned()),
        args.royalty_basis_points.to_string(),
    )?;

    let mut total_share: u8 = 0;
    // add creators and their respective shares to metadata
    for creator in args.creators.clone() {
        // validate that the creator is a valid publickey
        total_share = total_share
            .checked_add(creator.share)
            .ok_or(MetadataErrors::CreatorShareInvalid)?;
        ctx.accounts.update_token_metadata_field(
            Field::Key(creator.address.to_string()),
            creator.share.to_string(),
        )?;
    }

    if total_share != 100 {
        return Err(MetadataErrors::CreatorShareInvalid.into());
    }

    // for all the keys in metadata.additional_metadata, if the key is not in the args, remove it
    let creators = args.creators;
    for key in metadata.additional_metadata {
        if !creators
            .iter()
            .any(|creator| creator.address == Pubkey::from_str(&key.0).unwrap())
        {
            ctx.accounts.remove_token_metadata_field(key.0)?;
        }
    }

    // transfer minimum rent to mint account
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
