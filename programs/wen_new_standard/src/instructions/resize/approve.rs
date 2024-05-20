use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct ResizeApprove<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        realloc = 8 + ApproveAccount::INIT_SPACE + 1,
        realloc::payer = payer,
        realloc::zero = false,
    )]
    pub approve_account: Account<'info, ApproveAccount>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_: Context<ResizeApprove>) -> Result<()> {
    Ok(())
}
