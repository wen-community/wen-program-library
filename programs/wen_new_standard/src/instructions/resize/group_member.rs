use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct ResizeGroupMember<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        realloc = 8 + TokenGroupMember::INIT_SPACE + 1,
        realloc::payer = payer,
        realloc::zero = false,
        seeds = [MEMBER_ACCOUNT_SEED, member.mint.as_ref()],
        bump,
    )]
    pub member: Account<'info, TokenGroupMember>,
    pub system_program: Program<'info, System>,
}

pub fn handler(_: Context<ResizeGroupMember>) -> Result<()> {
    Ok(())
}
