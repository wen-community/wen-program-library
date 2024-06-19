use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateDistributionBump<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [distribution_account.group_mint.as_ref(), distribution_account.payment_mint.as_ref()],
        bump
    )]
    pub distribution_account: Account<'info, DistributionAccount>,
}

pub fn handler(ctx: Context<UpdateDistributionBump>) -> Result<()> {
    let distribution_account = &mut ctx.accounts.distribution_account;
    distribution_account.bump = ctx.bumps.distribution_account;
    Ok(())
}
