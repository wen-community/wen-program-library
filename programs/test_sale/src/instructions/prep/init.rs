use anchor_lang::prelude::*;
use wen_new_standard::TokenGroup;
use wen_royalty_distribution::DistributionAccount;

use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,

    #[account(
        init,
        space = Sale::size(),
        payer = payer,
        seeds = [
            TEST_SALE,
            SALE,
            group.key().as_ref(),
            distribution.key().as_ref()
        ],
        bump,
    )]
    pub sale: Account<'info, Sale>,

    /// CHECK: Checks made inside WNS program
    #[account()]
    pub group: Account<'info, TokenGroup>,

    /// CHECK: Checks made inside distribution program
    #[account()]
    pub distribution: Account<'info, DistributionAccount>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let sale = &mut ctx.accounts.sale;
    sale.bump = ctx.bumps.sale;
    sale.authority = ctx.accounts.authority.key();
    sale.distribution = ctx.accounts.distribution.key();
    sale.group = ctx.accounts.group.key();

    Ok(())
}
