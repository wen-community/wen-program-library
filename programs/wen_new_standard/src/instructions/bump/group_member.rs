use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct UpdateBumpGroupMember<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [MEMBER_ACCOUNT_SEED, member.mint.as_ref()],
        bump,
    )]
    pub member: Account<'info, TokenGroupMember>,
}

pub fn handler(ctx: Context<UpdateBumpGroupMember>) -> Result<()> {
    let member = &mut ctx.accounts.member;
    member.bump = ctx.bumps.member;
    Ok(())
}
