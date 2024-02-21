use anchor_lang::prelude::*;

use crate::{DistributionAccount, TokenGroup};

#[derive(Accounts)]
#[instruction()]
pub struct InitializeDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        constraint = group.update_authority.key() == authority.key()
    )]
    pub group: Account<'info, TokenGroup>,
    #[account(
        init,
        seeds = [group.mint.key().as_ref()],
        bump,
        payer = payer,
        space = DistributionAccount::LEN
    )]
    pub distribution: Box<Account<'info, DistributionAccount>>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeDistribution>) -> Result<()> {
    let group = &mut ctx.accounts.group;
    let mint = group.mint.key();

    ctx.accounts.distribution.data = vec![];
    ctx.accounts.distribution.authority = ctx.accounts.authority.key();
    ctx.accounts.distribution.collection = group.key();
    Ok(())
}
