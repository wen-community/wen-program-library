use anchor_lang::prelude::*;

use crate::{Manager, MANAGER_SEED};

#[derive(Accounts)]
#[instruction()]
pub struct InitManagerAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [MANAGER_SEED],
        space = 8 + Manager::INIT_SPACE,
        bump
    )]
    pub manager: Account<'info, Manager>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_ctx: Context<InitManagerAccount>) -> Result<()> {
    // ctx.accounts.manager.bump = ctx.bumps.manager;
    Ok(())
}
