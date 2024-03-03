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
    TokenMetadataUpdateFieldArgs,
};

use crate::{MetadataErrors, ROYALTY_BASIS_POINTS_FIELD};

use spl_token_metadata_interface::instruction::remove_key;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreatorWithShare {
    pub address: String,
    pub share: u8,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct ModifyRoyaltiesArgs {
    pub royalty_basis_points: u16,
    pub creators: Vec<CreatorWithShare>,
}

#[derive(Accounts)]
#[instruction(args: ModifyRoyaltiesArgs)]
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
    pub token_program: Program<'info, Token2022>,
}

impl<'info> ModifyRoyalties<'info> {
    fn update_token_metadata_field(&self, field: Field, value: String) -> ProgramResult {
        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info(),
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_update_field(cpi_ctx, TokenMetadataUpdateFieldArgs { field, value })?;
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

pub fn handler(ctx: Context<ModifyRoyalties>, args: ModifyRoyaltiesArgs) -> Result<()> {
    let mint_account = ctx.accounts.mint.to_account_info();
    let mint_account_data = mint_account.try_borrow_data()?;
    let mint_data = StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;
    let creators_arg = &args.creators;

    // since this field is already there, it will just update it with the new value if there is one
    ctx.accounts.update_token_metadata_field(
        Field::Key(ROYALTY_BASIS_POINTS_FIELD.to_owned()),
        args.royalty_basis_points.to_string(),
    )?;

    let mut total_share: u8 = 0;

    for creator in creators_arg {
        Pubkey::from_str(&creator.address).unwrap();
        total_share = total_share
            .checked_add(creator.share)
            .ok_or(MetadataErrors::CreatorShareInvalid)?;
        ctx.accounts.update_token_metadata_field(
            Field::Key(creator.address.clone()),
            creator.share.to_string(),
        )?;
    }

    if total_share != 100 {
        return Err(MetadataErrors::CreatorShareInvalid.into());
    }

    // remove all the creators that don't need to be there anymore
    let keys_to_remove: Vec<String> = metadata
        .additional_metadata
        .iter()
        .filter_map(|(key, _)| match Pubkey::from_str(key) {
            Ok(pubkey) => {
                if !creators_arg
                    .iter()
                    .any(|creator| creator.address == pubkey.to_string())
                {
                    Some(key.clone())
                } else {
                    None
                }
            }
            Err(_) => None,
        })
        .collect();

    for key in keys_to_remove {
        ctx.accounts.remove_token_metadata_field(key)?;
    }

    Ok(())
}
