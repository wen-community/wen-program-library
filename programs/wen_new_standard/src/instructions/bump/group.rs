use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateBumpGroup<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [GROUP_ACCOUNT_SEED, group.mint.as_ref()],
        bump,
    )]
    pub group: Account<'info, TokenGroup>,
}

pub fn handler(ctx: Context<UpdateBumpGroup>) -> Result<()> {
    let group = &mut ctx.accounts.group;
    group.bump = ctx.bumps.group;
    Ok(())
}