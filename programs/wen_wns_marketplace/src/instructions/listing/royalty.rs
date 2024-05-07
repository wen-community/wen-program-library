use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{TokenAccount, TokenInterface},
};
use wen_royalty_distribution::{
    cpi::{accounts::ClaimDistribution, claim_distribution},
    program::WenRoyaltyDistribution,
    DistributionAccount,
};

#[derive(Accounts)]
pub struct ClaimRoyalty<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Could be SOL or SPL, checked in distribution program
    pub payment_mint: UncheckedAccount<'info>,
    #[account(
        mut,
        has_one = payment_mint,
    )]
    pub distribution: Account<'info, DistributionAccount>,

    pub wen_distribution_program: Program<'info, WenRoyaltyDistribution>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

    /* Optional accounts */
    #[account(
        mut,
        token::authority = distribution,
        token::mint = payment_mint,
        token::token_program = token_program,
    )]
    pub distribution_payment_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        token::authority = creator,
        token::mint = payment_mint,
        token::token_program = token_program,
    )]
    pub creator_payment_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
}

pub fn handler(ctx: Context<ClaimRoyalty>) -> Result<()> {
    // CPI Claim distribution
    let distribution_token_account_info = ctx
        .accounts
        .distribution_payment_token_account
        .as_ref()
        .map(|d| d.to_account_info());

    let creator_token_account_info = ctx
        .accounts
        .creator_payment_token_account
        .as_ref()
        .map(|c| c.to_account_info());

    claim_distribution(CpiContext::new(
        ctx.accounts.wen_distribution_program.to_account_info(),
        ClaimDistribution {
            creator: ctx.accounts.creator.to_account_info(),
            payment_mint: ctx.accounts.payment_mint.to_account_info(),
            creator_token_account: creator_token_account_info,
            distribution: ctx.accounts.distribution.to_account_info(),
            distribution_token_account: distribution_token_account_info,
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    ))?;

    Ok(())
}
