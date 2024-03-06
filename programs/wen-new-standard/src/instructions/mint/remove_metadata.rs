use std::str::FromStr;

use anchor_lang::{prelude::*, solana_program::program::invoke};

use anchor_spl::token_interface::{Mint, Token2022};

use spl_token_metadata_interface::instruction::remove_key;

use crate::errors::MetadataErrors;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct RemoveMetadataArgs {
    pub field: String,
    pub value: String,
}

#[derive(Accounts)]
pub struct RemoveMetadata<'info> {
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

impl<'info> RemoveMetadata<'info> {
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

pub fn handler(ctx: Context<RemoveMetadata>, args: Vec<RemoveMetadataArgs>) -> Result<()> {
    for metadata_arg in args {
        // validate that the field is not a publickey
        match Pubkey::from_str(&metadata_arg.field) {
            Ok(_) => {
                return Err(MetadataErrors::InvalidField.into());
            }
            Err(_) => {
                ctx.accounts
                    .remove_token_metadata_field(metadata_arg.field)?;
            }
        }
    }

    Ok(())
}
