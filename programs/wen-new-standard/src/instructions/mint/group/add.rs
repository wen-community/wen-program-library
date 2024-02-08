use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    group_member_pointer_update, GroupMemberPointerUpdate, Mint, Token2022,
};

use crate::{TokenGroup, TokenGroupMember, MEMBER_ACCOUNT_SEED, TOKEN22};

#[derive(Accounts)]
#[instruction()]
pub struct AddGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = group.update_authority == authority.key(),
    )]
    pub group: Account<'info, TokenGroup>,
    #[account(
        init,
        seeds = [MEMBER_ACCOUNT_SEED, mint.key().as_ref()],
        bump,
        payer = payer,
        space = TokenGroupMember::LEN
    )]
    pub member: Account<'info, TokenGroupMember>,
    #[account(
        mint::token_program = TOKEN22
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl AddGroup<'_> {
    fn update_group_member_pointer_member_address(&self, member: Pubkey) -> Result<()> {
        let cpi_accounts = GroupMemberPointerUpdate {
            token_program_id: self.token_program.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        group_member_pointer_update(cpi_ctx, Some(member))?;
        Ok(())
    }
}

pub fn handler(ctx: Context<AddGroup>) -> Result<()> {
    let group = &mut ctx.accounts.group;
    group.increment_size()?;

    let member = &mut ctx.accounts.member;
    member.group = group.key();
    member.mint = ctx.accounts.mint.key();
    member.member_number = group.size;

    let member_address = member.key();
    ctx.accounts
        .update_group_member_pointer_member_address(member_address)?;

    Ok(())
}
