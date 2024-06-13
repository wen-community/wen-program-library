use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use anchor_spl::token_interface::{
    spl_token_metadata_interface::state::Field, token_metadata_update_field, Mint, Token2022,
    TokenMetadataUpdateField,
};

use crate::{MetadataErrors, TokenGroup, GROUP_ACCOUNT_SEED};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateGroupAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub max_size: u32,
}

#[derive(Accounts)]
#[instruction(args: UpdateGroupAccountArgs)]
pub struct UpdateGroupAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    /// CHECK: can be any account
    pub authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [GROUP_ACCOUNT_SEED, mint.key().as_ref()],
        bump,
    )]
    pub group: Account<'info, TokenGroup>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> UpdateGroupAccount<'info> {
    fn update_metadata(&self, field: Field, value: String) -> ProgramResult {
        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_update_field(cpi_ctx, field, value)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<UpdateGroupAccount>, args: UpdateGroupAccountArgs) -> Result<()> {
    if args.max_size < ctx.accounts.group.size {
        return Err(MetadataErrors::MaxSizeBelowCurrentSize.into());
    }

    // update group max size
    ctx.accounts.group.max_size = args.max_size;

    // update metadata name
    ctx.accounts.update_metadata(Field::Name, args.name)?;

    // update metadata symbol
    ctx.accounts.update_metadata(Field::Symbol, args.symbol)?;

    // update metadata uri
    ctx.accounts.update_metadata(Field::Uri, args.uri)?;

    Ok(())
}
