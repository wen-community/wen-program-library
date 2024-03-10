use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, Token2022, TokenAccount,
        close_account, CloseAccount,
        burn, Burn, 
    },
};

use crate::{Manager, MANAGER_SEED};

#[derive(Accounts)]
pub struct BurnMintAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    pub user: Signer<'info>,
    #[account(mut)]
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
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> BurnMintAccount<'info> {
    fn close_token_account(&self) -> Result<()> {
        let cpi_accounts = CloseAccount {
            account: self.mint_token_account.to_account_info(),
            destination: self.payer.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        close_account(cpi_ctx)?;

        Ok(())
    }

    fn close_mint_account(&self, bumps: BurnMintAccountBumps) -> Result<()> {
        let seeds: &[&[u8]; 2] = &[
            MANAGER_SEED,
            &[bumps.manager],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = CloseAccount {
            account: self.mint.to_account_info(),
            destination: self.payer.to_account_info(),
            authority: self.manager.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds);
        close_account(cpi_ctx)?;

        Ok(())
    }

    fn burn_token(&self) -> Result<()> {
        let cpi_accounts = Burn {
            mint: self.mint.to_account_info(),
            from: self.mint_token_account.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        burn(cpi_ctx, 1)?;
        
        Ok(())
    }
}

pub fn handler(ctx: Context<BurnMintAccount>) -> Result<()> {
    // burn the token
    ctx.accounts.burn_token()?;

    // close the token account
    ctx.accounts.close_token_account()?;

    // close the mint account
    ctx.accounts.close_mint_account(ctx.bumps)?;

    // TODO: decrease collection number of the group

    Ok(())
}
