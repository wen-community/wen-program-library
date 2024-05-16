use anchor_lang::prelude::*;

use anchor_spl::{
    token_2022::ID as TOKEN_2022_PROGRAM_ID,
    token_interface::{
        token_group::{token_member_initialize, TokenMemberInitialize},
        Mint, Token2022,
    },
};

#[derive(Accounts)]
#[instruction()]
pub struct AddGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    pub group_update_authority: Signer<'info>,
    #[account()]
    pub member_mint_authority: Signer<'info>,
    #[account(
        mut,
        mint::token_program = TOKEN_2022_PROGRAM_ID
    )]
    pub group_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        mint::token_program = TOKEN_2022_PROGRAM_ID
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl AddGroup<'_> {
    fn initialize_token_member(&self) -> Result<()> {
        let cpi_accounts = TokenMemberInitialize {
            token_program_id: self.token_program.to_account_info(),
            group: self.group_mint.to_account_info(),
            member: self.mint.to_account_info(),
            member_mint: self.mint.to_account_info(),
            group_update_authority: self.group_update_authority.to_account_info(),
            member_mint_authority: self.member_mint_authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_member_initialize(cpi_ctx)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<AddGroup>) -> Result<()> {
    ctx.accounts.initialize_token_member()?;
    Ok(())
}
