use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::TokenInterface};
use wen_royalty_distribution::{
    cpi::{accounts::ClaimDistribution, claim_distribution},
    program::WenRoyaltyDistribution,
    DistributionAccount,
};

use crate::utils::assert_right_associated_token_account;
use crate::{errors::*, utils::create_associated_token_account};

#[derive(Accounts)]
pub struct ClaimRoyalty<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Could be SOL or SPL, checked in distribution program
    pub payment_mint: UncheckedAccount<'info>,

    /// CHECK: Checked based on payment_mint
    #[account(mut)]
    pub creator_payment_token_account: UncheckedAccount<'info>,

    #[account(
        mut,
        has_one = payment_mint,
    )]
    pub distribution: Account<'info, DistributionAccount>,

    /// CHECK: Created and checked based on payment_mint
    #[account(mut)]
    pub distribution_payment_token_account: UncheckedAccount<'info>,

    pub wen_distribution_program: Program<'info, WenRoyaltyDistribution>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimRoyalty>) -> Result<()> {
    let is_payment_mint_spl = ctx.accounts.payment_mint.key.ne(&Pubkey::default());

    // Create ATA for creator if payment_mint is SPL
    if is_payment_mint_spl {
        require_neq!(
            ctx.accounts.creator_payment_token_account.key,
            &Pubkey::default(),
            WenWnsMarketplaceError::PaymentTokenAccountNotExistant
        );

        require_neq!(
            ctx.accounts.distribution_payment_token_account.key,
            &Pubkey::default(),
            WenWnsMarketplaceError::PaymentTokenAccountNotExistant
        );

        assert_right_associated_token_account(
            &ctx.accounts.distribution.key(),
            ctx.accounts.payment_mint.key,
            ctx.accounts.distribution_payment_token_account.key,
        )?;

        if ctx.accounts.creator_payment_token_account.data_is_empty() {
            create_associated_token_account(
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.payment_mint.to_account_info(),
                ctx.accounts.creator_payment_token_account.to_account_info(),
                ctx.accounts.associated_token_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            )?;
        }
    }

    // CPI Claim distribution
    claim_distribution(CpiContext::new(
        ctx.accounts.wen_distribution_program.to_account_info(),
        ClaimDistribution {
            creator: ctx.accounts.creator.to_account_info(),
            payment_mint: ctx.accounts.payment_mint.to_account_info(),
            creator_token_account: ctx.accounts.creator_payment_token_account.to_account_info(),
            distribution: ctx.accounts.distribution.to_account_info(),
            distribution_token_account: ctx
                .accounts
                .distribution_payment_token_account
                .to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    ))?;

    Ok(())
}
