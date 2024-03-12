use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    Mint, Token2022, TokenAccount,
    FreezeAccount, freeze_account,
};
use spl_pod::solana_program::program_option::COption;

use crate::{Manager, MANAGER_SEED, MintErrors};

#[derive(Accounts)]
pub struct FreezeDelegatedAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    /// CHECK: can be any account
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub delegate_authority: Signer<'info>,
    #[account(
        mut,
        constraint = mint.freeze_authority == COption::Some(manager.key()) @MintErrors::InvalidFreezeAuthority
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = user,
        // constraint = mint_token_account.delegate == COption::Some(delegate_authority.key()) @MintErrors::InvalidDelegateAuthority
    )]
    pub mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        seeds = [MANAGER_SEED],
        bump
    )]
    pub manager: Account<'info, Manager>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> FreezeDelegatedAccount<'info> {

    fn freeze(&self, bumps: FreezeDelegatedAccountBumps) -> Result<()> {
        let seeds: &[&[u8]; 2] = &[
            MANAGER_SEED,
            &[bumps.manager],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = FreezeAccount {
            account: self.mint_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.manager.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds);
        freeze_account(cpi_ctx)?;

        Ok(())
    }
}

pub fn handler(ctx: Context<FreezeDelegatedAccount>) -> Result<()> {

    // freeze the token account
    ctx.accounts.freeze(ctx.bumps)?;

    Ok(())
}
