use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{revoke, Revoke, Token2022},
    token_interface::{Mint, TokenAccount},
};
use wen_new_standard::{
    cpi::{accounts::ThawDelegatedAccount, thaw_mint_account},
    program::WenNewStandard,
};

use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UnlistNFT<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [
            MARKETPLACE,
            LISTING,
            listing.seller.key().as_ref(),
            listing.mint.key().as_ref()
        ],
        bump = listing.bump,
        has_one = mint,
        has_one = seller,
        has_one = seller_token_account,
    )]
    pub listing: Account<'info, Listing>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = seller,
    )]
    pub seller_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Checked inside WNS program
    pub manager: UncheckedAccount<'info>,

    pub wns_program: Program<'info, WenNewStandard>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UnlistNFT>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    // Thawing NFT via Listing PDA
    let signer_seeds: &[&[&[u8]]] = &[&[
        MARKETPLACE,
        LISTING,
        listing.seller.as_ref(),
        listing.mint.as_ref(),
        &[listing.bump],
    ]];

    thaw_mint_account(CpiContext::new_with_signer(
        ctx.accounts.wns_program.to_account_info(),
        ThawDelegatedAccount {
            payer: ctx.accounts.payer.to_account_info(),
            delegate_authority: listing.to_account_info(),
            manager: ctx.accounts.manager.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            mint_token_account: ctx.accounts.seller_token_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            user: ctx.accounts.seller.to_account_info(),
        },
        signer_seeds,
    ))?;

    // Revoking NFT to Sale PDA
    revoke(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Revoke {
            source: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        },
    ))?;

    // Closing listing account
    listing.close(ctx.accounts.payer.to_account_info())?;

    Ok(())
}
