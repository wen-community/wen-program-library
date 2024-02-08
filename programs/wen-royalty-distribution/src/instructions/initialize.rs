use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::DistributionAccount;

#[derive(Accounts)]
#[instruction()]
pub struct InitializeDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mint::token_program = anchor_spl::token_interface::spl_token_2022::id()
    )]
    /// CHECK: collection account, can be any account
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        seeds = [mint.key().as_ref()],
        bump,
        payer = payer,
        space = DistributionAccount::LEN
    )]
    pub distribution: Box<Account<'info, DistributionAccount>>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeDistribution>) -> Result<()> {
    ctx.accounts.distribution.data = vec![];
    ctx.accounts.distribution.authority = ctx.accounts.authority.key();
    ctx.accounts.distribution.collection = ctx.accounts.mint.key();
    Ok(())
}
