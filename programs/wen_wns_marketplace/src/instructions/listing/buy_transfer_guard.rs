use anchor_lang::{
    prelude::*,
    solana_program::program::invoke,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{
        spl_token_2022::{extension::StateWithExtensions, state::Mint as StateMint},
        transfer_checked, Token2022, TransferChecked,
    },
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use royalties_interface::{calculate_royalties, generate_royalty_ixs};
use wen_new_standard::{
    cpi::{accounts::ThawDelegatedAccount, thaw_mint_account},
    program::WenNewStandard,
    wen_transfer_guard::program::WenTransferGuard,
};

use crate::constants::*;
use crate::errors::*;
use crate::state::*;
use crate::utils::*;

#[derive(Accounts)]
#[instruction(args: FulfillListingTransferGuardArgs)]
pub struct FulfillListingTransferGuard<'info> {
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

    #[account(mut)]
    pub seller: SystemAccount<'info>,

    /// CHECK: Checked inside WNS program
    pub manager: UncheckedAccount<'info>,
    /// CHECK: Checked inside Token extensions program
    pub extra_metas_account: UncheckedAccount<'info>,
    /// CHECK: Checked inside WNS program
    #[account(mut)]
    pub approve_account: UncheckedAccount<'info>,

    pub wns_program: Program<'info, WenNewStandard>,
    pub wen_transfer_guard_program: Program<'info, WenTransferGuard>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub payment_token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,

    /* Optional accounts */
    #[account(
      mut,
      token::authority = seller,
      token::mint = payment_mint,
      token::token_program = payment_token_program
  )]
    pub seller_payment_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
      mut,
      token::authority = buyer,
      token::mint = payment_mint,
      token::token_program = payment_token_program
  )]
    pub buyer_payment_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, FulfillListingTransferGuard<'info>>,
    args: FulfillListingTransferGuardArgs,
) -> Result<()> {
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
    let (royalty_funds, _, _) =
        calculate_royalties(&ctx.accounts.mint.to_account_info(), args.buy_amount)?;

    let funds_to_send = listing
        .listing_amount
        .checked_sub(royalty_funds)
        .ok_or(WenWnsMarketplaceError::ArithmeticError)?;

    let buyer_token_account_info = if is_payment_mint_spl {
        let payment_mint = &ctx.accounts.payment_mint.try_borrow_data()?;
        let payment_mint_data = StateWithExtensions::<StateMint>::unpack(payment_mint)?;

        let buyer_payment_token_account = ctx
            .accounts
            .buyer_payment_token_account
            .clone()
            .ok_or(WenWnsMarketplaceError::InvalidPaymentTokenAccount)?;

        let seller_payment_token_account = ctx
            .accounts
            .seller_payment_token_account
            .clone()
            .ok_or(WenWnsMarketplaceError::InvalidPaymentTokenAccount)?;

        transfer_checked(
            CpiContext::new(
                ctx.accounts
                    .payment_token_program
                    .clone()
                    .unwrap()
                    .to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.buyer.to_account_info(),
                    from: buyer_payment_token_account.to_account_info(),
                    to: seller_payment_token_account.to_account_info(),
                    mint: ctx.accounts.payment_mint.to_account_info(),
                },
            ),
            funds_to_send,
            payment_mint_data.base.decimals,
        )?;

        Some(buyer_payment_token_account.to_account_info())
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
        None
    };

    // Royalties interface instructions
    let payment_token_program = ctx
        .accounts
        .payment_token_program
        .as_ref()
        .map(|d| d.to_account_info());

    let royalty_ixs = generate_royalty_ixs(
        args.buy_amount,
        &ctx.accounts.mint.to_account_info(),
        ctx.accounts.buyer.key,
        &payment_token_program,
        is_payment_mint_spl,
    )?;

    for (ix_index, royalty_ix) in royalty_ixs.iter().enumerate() {
        let remaining_accounts = ctx.remaining_accounts;
        let creator = remaining_accounts.get(ix_index);
        if creator.is_none() {
            return err!(WenWnsMarketplaceError::CreatorMissing);
        }
        let creator = creator.unwrap();

        if royalty_ix.program_id == ctx.accounts.system_program.key() {
            invoke(
                royalty_ix,
                &[
                    ctx.accounts.buyer.to_account_info(),
                    creator.clone(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
            continue;
        }

        let creator_token_account = remaining_accounts.get(ix_index + 1);
        if creator_token_account.is_none() {
            return err!(WenWnsMarketplaceError::CreatorTokenAccountMissing);
        }
        let creator_token_account = creator_token_account.unwrap();

        if royalty_ix.program_id == ctx.accounts.associated_token_program.key() {
            invoke(
                royalty_ix,
                &[
                    ctx.accounts.buyer.to_account_info(),
                    creator_token_account.clone(),
                    creator.clone(),
                    ctx.accounts.payment_mint.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                    ctx.accounts.token_program.to_account_info(),
                ],
            )?;
        } else {
            invoke(
                royalty_ix,
                &[
                    buyer_token_account_info.clone().unwrap(),
                    ctx.accounts.payment_mint.to_account_info(),
                    creator_token_account.clone(),
                    ctx.accounts.buyer.to_account_info(),
                ],
            )?;
        }
    }

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
pub struct FulfillListingTransferGuardArgs {
    pub buy_amount: u64,
}
