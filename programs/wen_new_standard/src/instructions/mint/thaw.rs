use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    spl_pod::solana_program::program_option::COption, thaw_account, Mint, ThawAccount, Token2022,
    TokenAccount,
};

use crate::{Manager, MintErrors, MANAGER_SEED};

#[derive(Accounts)]
pub struct ThawDelegatedAccount<'info> {
    #[account()]
    /// CHECK: can be any account
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub delegate_authority: Signer<'info>,
    #[account(
        constraint = mint.freeze_authority == COption::Some(manager.key()) @MintErrors::InvalidFreezeAuthority
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = user,
        constraint = mint_token_account.delegate == COption::Some(delegate_authority.key()) @MintErrors::InvalidDelegateAuthority
    )]
    pub mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        seeds = [MANAGER_SEED],
        bump
    )]
    pub manager: Account<'info, Manager>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> ThawDelegatedAccount<'info> {
    fn thaw(&self, bumps: ThawDelegatedAccountBumps) -> Result<()> {
        let seeds: &[&[u8]; 2] = &[MANAGER_SEED, &[bumps.manager]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = ThawAccount {
            account: self.mint_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.manager.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        thaw_account(cpi_ctx)?;

        Ok(())
    }
}

pub fn handler(ctx: Context<ThawDelegatedAccount>) -> Result<()> {
    // thaw the token account
    ctx.accounts.thaw(ctx.bumps)?;

    Ok(())
}
