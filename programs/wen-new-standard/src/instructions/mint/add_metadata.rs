use std::str::FromStr;

use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};

use anchor_spl::token_interface::{
    spl_token_metadata_interface::state::Field, token_metadata_update_field, Mint, Token2022,
    TokenMetadataUpdateField, TokenMetadataUpdateFieldArgs,
};

use crate::MetadataErrors;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AddMetadataArgs {
    pub field: String,
    pub value: String,
}

#[derive(Accounts)]
pub struct AddMetadata<'info> {
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

impl<'info> AddMetadata<'info> {
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
}

pub fn handler(ctx: Context<AddMetadata>, args: AddMetadataArgs) -> Result<()> {
    match Pubkey::from_str(&args.field) {
        Ok(_) => {
            return Err(MetadataErrors::InvalidField.into());
        }
        Err(_) => {
            ctx.accounts
                .update_token_metadata_field(Field::Key(args.field), args.value.to_string())?;
        }
    }

    Ok(())
}
