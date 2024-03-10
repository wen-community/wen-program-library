use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    Mint, Token2022, TokenAccount,
    ThawAccount, thaw_account,
}; 
use spl_pod::solana_program::program_option::COption;

use crate::{Manager, MANAGER_SEED, MintErrors};

#[derive(Accounts)]
pub struct ThawDelegatedAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    /// CHECK: can be any account
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub delegate_authority: Signer<'info>,
    #[account()]
    #[account(
        mut
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = user,
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
    fn assert_freeze_authority(&self) -> Result<()> {
        require!(self.mint.freeze_authority == COption::Some(self.manager.key()), MintErrors::InvalidFreezeAuthority);

        Ok(())
    }

    fn assert_delegate_authority(&self) -> Result<()> {
        require!(self.mint_token_account.delegate == COption::Some(self.delegate_authority.key()), MintErrors::InvalidDelegateAuthority);

        Ok(())
    }

    fn thaw(&self, bumps: ThawDelegatedAccountBumps) -> Result<()> {
        let seeds: &[&[u8]; 2] = &[
            MANAGER_SEED,
            &[bumps.manager],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = ThawAccount {
            account: self.mint_token_account.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.manager.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds);
        thaw_account(cpi_ctx)?;

        Ok(())
    }
}

pub fn handler(ctx: Context<ThawDelegatedAccount>) -> Result<()> {
    // check if the freeze authority is the manager
    ctx.accounts.assert_freeze_authority()?;

    // check if the delegate authority is the signer passed in the instruction
    ctx.accounts.assert_delegate_authority()?;

    // freeze the token account
    ctx.accounts.thaw(ctx.bumps)?;

    Ok(())
}
