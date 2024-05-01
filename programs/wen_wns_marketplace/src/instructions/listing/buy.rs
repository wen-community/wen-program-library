use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::{extension::StateWithExtensions, state::Mint as StateMint},
    token_2022::{transfer_checked, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};
use wen_new_standard::{
    cpi::{
        accounts::{ApproveTransfer, ThawDelegatedAccount},
        approve_transfer, thaw_mint_account,
    },
    program::WenNewStandard,
};
use wen_royalty_distribution::{program::WenRoyaltyDistribution, DistributionAccount};

use crate::{
    constants::*,
    utils::{
        assert_right_associated_token_account, transfer_checked_with_hook, TransferCheckedWithHook,
    },
};
use crate::{errors::*, utils::create_associated_token_account};
use crate::{state::*, utils::calculate_royalties};

#[derive(Accounts)]
#[instruction(args: FulfillListingArgs)]
pub struct FulfillListing<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            MARKETPLACE,
            LISTING,
            listing.seller.as_ref(),
            listing.mint.as_ref(),
        ],
        bump = listing.bump,
        has_one = mint,
        has_one = seller,
        has_one = seller_token_account,
        constraint = args.buy_amount.eq(&args.buy_amount) @ WenWnsMarketplaceError::ListingAmountMismatch
    )]
    pub listing: Account<'info, Listing>,

    /// CHECK: Could be SOL or SPL, checked in distribution program
    pub payment_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Checked based on payment_mint
    #[account(mut)]
    pub buyer_payment_token_account: UncheckedAccount<'info>,

    #[account(
        mut,
        has_one = payment_mint,
        constraint = listing.payment_mint.eq(&distribution.payment_mint)
    )]
    pub distribution: Account<'info, DistributionAccount>,

    /// CHECK: Created and checked based on payment_mint
    #[account(mut)]
    pub distribution_payment_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = seller,
    )]
    pub seller_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Constraint checked with listing. Could be any account
    #[account(mut)]
    pub seller: SystemAccount<'info>,

    /// CHECK: Checked based on payment_mint
    #[account(mut)]
    pub seller_payment_token_account: UncheckedAccount<'info>,

    /// CHECK: Checked inside WNS program
    pub manager: UncheckedAccount<'info>,
    /// CHECK: Checked inside Token extensions program
    pub extra_metas_account: UncheckedAccount<'info>,
    /// CHECK: Checked inside WNS program
    #[account(mut)]
    pub approve_account: UncheckedAccount<'info>,

    pub wns_program: Program<'info, WenNewStandard>,
    pub distribution_program: Program<'info, WenRoyaltyDistribution>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FulfillListing>, args: FulfillListingArgs) -> Result<()> {
    let listing = &mut ctx.accounts.listing;

    let is_payment_mint_spl = ctx.accounts.payment_mint.key.ne(&Pubkey::default());

    let signer_seeds: &[&[&[u8]]] = &[&[
        MARKETPLACE,
        LISTING,
        listing.seller.as_ref(),
        listing.mint.as_ref(),
        &[listing.bump],
    ]];

    // Thaw NFT
    thaw_mint_account(CpiContext::new_with_signer(
        ctx.accounts.wns_program.to_account_info(),
        ThawDelegatedAccount {
            delegate_authority: listing.to_account_info(),
            manager: ctx.accounts.manager.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            mint_token_account: ctx.accounts.seller_token_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            user: ctx.accounts.seller.to_account_info(),
        },
        signer_seeds,
    ))?;

    // Transfer (listing_amount - royalty) to seller
    // Checking payment mint and creating seller token account if necessary
    let royalty_funds = calculate_royalties(&ctx.accounts.mint.to_account_info(), args.buy_amount)?;

    let funds_to_send = listing
        .listing_amount
        .checked_sub(royalty_funds)
        .ok_or(WenWnsMarketplaceError::ArithmeticError)?;

    if is_payment_mint_spl {
        let payment_mint = &ctx.accounts.payment_mint.try_borrow_data()?;
        let payment_mint_data = StateWithExtensions::<StateMint>::unpack(payment_mint)?;

        require_neq!(
            ctx.accounts.buyer_payment_token_account.key,
            &Pubkey::default(),
            WenWnsMarketplaceError::PaymentTokenAccountNotExistant
        );

        require_neq!(
            ctx.accounts.buyer_payment_token_account.key,
            &Pubkey::default(),
            WenWnsMarketplaceError::PaymentTokenAccountNotExistant
        );

        assert_right_associated_token_account(
            ctx.accounts.buyer.key,
            ctx.accounts.payment_mint.key,
            ctx.accounts.buyer_payment_token_account.key,
        )?;

        if ctx.accounts.seller_payment_token_account.data_is_empty() {
            create_associated_token_account(
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.payment_mint.to_account_info(),
                ctx.accounts.seller_payment_token_account.to_account_info(),
                ctx.accounts.associated_token_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            )?;
        }

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.buyer.to_account_info(),
                    from: ctx.accounts.buyer_payment_token_account.to_account_info(),
                    to: ctx.accounts.seller_payment_token_account.to_account_info(),
                    mint: ctx.accounts.payment_mint.to_account_info(),
                },
            ),
            funds_to_send,
            payment_mint_data.base.decimals,
        )?;
    } else {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.seller.to_account_info(),
                },
            ),
            funds_to_send,
        )?;
    }

    // Approve Transfer
    if is_payment_mint_spl
        && ctx
            .accounts
            .distribution_payment_token_account
            .data_is_empty()
    {
        create_associated_token_account(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.distribution.to_account_info(),
            ctx.accounts.payment_mint.to_account_info(),
            ctx.accounts
                .distribution_payment_token_account
                .to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        )?;
    }

    approve_transfer(
        CpiContext::new(
            ctx.accounts.wns_program.to_account_info(),
            ApproveTransfer {
                payer: ctx.accounts.payer.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
                payment_mint: ctx.accounts.payment_mint.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                distribution_account: ctx.accounts.distribution.to_account_info(),
                authority_token_account: ctx.accounts.buyer_payment_token_account.to_account_info(),
                distribution_token_account: ctx
                    .accounts
                    .distribution_payment_token_account
                    .to_account_info(),
                approve_account: ctx.accounts.approve_account.to_account_info(),
                distribution_program: ctx.accounts.distribution_program.to_account_info(),
                associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ),
        args.buy_amount,
    )?;

    // Transfer NFT to buyer
    transfer_checked_with_hook(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferCheckedWithHook {
                authority: listing.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                extra_metas_account: ctx.accounts.extra_metas_account.to_account_info(),
                approve_account: ctx.accounts.approve_account.to_account_info(),
                wns_program: ctx.accounts.wns_program.to_account_info(),
            },
            signer_seeds,
        ),
        1,
        0,
    )?;

    // Close listing
    listing.close(ctx.accounts.payer.to_account_info())?;

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct FulfillListingArgs {
    pub buy_amount: u64,
}
