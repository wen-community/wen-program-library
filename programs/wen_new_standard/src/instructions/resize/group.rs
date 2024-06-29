use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct ResizeGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        realloc = 8 + TokenGroup::INIT_SPACE + 1,
        realloc::payer = payer,
        realloc::zero = false,
        seeds = [GROUP_ACCOUNT_SEED, group.mint.as_ref()],
        bump,
    )]
    pub group: Account<'info, TokenGroup>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_: Context<ResizeGroup>) -> Result<()> {
    Ok(())
}