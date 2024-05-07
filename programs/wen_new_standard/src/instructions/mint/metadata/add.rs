use std::str::FromStr;

use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};

use anchor_spl::token_interface::{
    spl_token_metadata_interface::state::Field, token_metadata_update_field, Mint, Token2022,
    TokenMetadataUpdateField,
};

use crate::{errors::MetadataErrors, update_account_lamports_to_minimum_balance};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AddMetadataArgs {
    pub field: String,
    pub value: String,
}

#[derive(Accounts)]
pub struct AddMetadata<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> AddMetadata<'info> {
    fn update_token_metadata_field(&self, field: Field, value: String) -> ProgramResult {
        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info(),
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_update_field(cpi_ctx, field, value)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<AddMetadata>, args: Vec<AddMetadataArgs>) -> Result<()> {
    for metadata_arg in args {
        // validate that the field is not a publickey
        match Pubkey::from_str(&metadata_arg.field) {
            Ok(_) => {
                return Err(MetadataErrors::InvalidField.into());
            }
            Err(_) => {
                ctx.accounts.update_token_metadata_field(
                    Field::Key(metadata_arg.field),
                    metadata_arg.value.to_string(),
                )?;
            }
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
