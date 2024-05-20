use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct ResizeManager<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        realloc = 8 + Manager::INIT_SPACE + 1,
        realloc::payer = payer,
        realloc::zero = false,
        seeds = [MANAGER_SEED],
        bump,
    )]
    pub manager: Account<'info, Manager>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_: Context<ResizeManager>) -> Result<()> {
    Ok(())
}
