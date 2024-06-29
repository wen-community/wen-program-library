use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateBumpManager<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [MANAGER_SEED],
        bump,
    )]
    pub manager: Account<'info, Manager>,
}

pub fn handler(ctx: Context<UpdateBumpManager>) -> Result<()> {
    let manager = &mut ctx.accounts.manager;
    manager.bump = ctx.bumps.manager;
    Ok(())
}