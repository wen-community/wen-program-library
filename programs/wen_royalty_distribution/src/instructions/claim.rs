use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use anchor_spl::{
    token::{self, Transfer},
    token_interface::Token2022,
};

use crate::{get_and_clear_creator_royalty_amount, get_bump_in_seed_form, DistributionAccount};

#[derive(Accounts)]
#[instruction(payment_mint: Pubkey)]
pub struct ClaimDistribution<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        seeds = [distribution.group_mint.as_ref(), payment_mint.as_ref()],
        bump,
    )]
    pub distribution: Account<'info, DistributionAccount>,
    /// CHECK: can be initialized token account or uninitialized token account, checks in cpi
    #[account(mut)]
    pub distribution_token_account: UncheckedAccount<'info>,
    /// CHECK: can be initialized token account or uninitialized token account, checks in cpi
    #[account(mut)]
    pub creator_token_account: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
}

impl ClaimDistribution<'_> {
    pub fn transfer_tokens(&self, amount: u64, signer_seeds: &[&[&[u8]]]) -> ProgramResult {
        let cpi_accounts = Transfer {
            from: self.distribution_token_account.to_account_info(),
            to: self.creator_token_account.to_account_info(),
            authority: self.distribution.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<ClaimDistribution>, payment_mint: Pubkey) -> Result<()> {
    let mut claim_data = ctx.accounts.distribution.claim_data.clone();
    let claim_amount =
        get_and_clear_creator_royalty_amount(ctx.accounts.creator.key(), &mut claim_data);

    if claim_amount == 0 {
        return Ok(()); // No royalties to claim
    }

    let signer_seeds = [
        ctx.accounts.distribution.group_mint.as_ref(),
        payment_mint.as_ref(),
        &get_bump_in_seed_form(&ctx.bumps.distribution),
    ];

    if payment_mint.key() == Pubkey::default() {
        ctx.accounts.distribution.sub_lamports(claim_amount)?;
        ctx.accounts.creator.add_lamports(claim_amount)?;
    } else {
        ctx.accounts
            .transfer_tokens(claim_amount, &[&signer_seeds[..]])?;
    }

    // update distribution account
    ctx.accounts.distribution.claim_data = claim_data;

    Ok(())
}
