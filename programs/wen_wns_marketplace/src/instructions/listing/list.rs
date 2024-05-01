use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{approve, Approve, Token2022},
    token_interface::{Mint, TokenAccount},
};
use wen_new_standard::{
    cpi::{accounts::FreezeDelegatedAccount, freeze_mint_account},
    program::WenNewStandard,
};

use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ListNFT<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub seller: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = Listing::size(),
        seeds = [
            MARKETPLACE,
            LISTING,
            seller.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
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

pub fn handler(ctx: Context<ListNFT>, args: ListNFTArgs) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    // Approving NFT to Listing PDA
    approve(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Approve {
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
                delegate: listing.to_account_info(),
            },
        ),
        1,
    )?;

    // Freezing NFT via Listing PDA
    let seller_key = ctx.accounts.seller.key();
    let mint_key = ctx.accounts.mint.key();

    let signer_seeds: &[&[&[u8]]] = &[&[
        MARKETPLACE,
        LISTING,
        seller_key.as_ref(),
        mint_key.as_ref(),
        &[ctx.bumps.listing],
    ]];

    freeze_mint_account(CpiContext::new_with_signer(
        ctx.accounts.wns_program.to_account_info(),
        FreezeDelegatedAccount {
            delegate_authority: listing.to_account_info(),
            manager: ctx.accounts.manager.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            mint_token_account: ctx.accounts.seller_token_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            user: ctx.accounts.seller.to_account_info(),
        },
        signer_seeds,
    ))?;

    // Assigning fields to listing
    listing.set_inner(Listing {
        bump: ctx.bumps.listing,
        listing_amount: args.listing_amount,
        payment_mint: args.payment_mint,
        mint: ctx.accounts.mint.key(),
        seller: ctx.accounts.seller.key(),
        seller_token_account: ctx.accounts.seller_token_account.key(),
    });

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ListNFTArgs {
    pub listing_amount: u64,
    pub payment_mint: Pubkey,
}
