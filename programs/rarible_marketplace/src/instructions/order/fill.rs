use std::str::FromStr;

use anchor_lang::{prelude::*, solana_program::sysvar};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::instruction::transfer_checked as transfer_2022,
    token_interface::{transfer_checked, Mint, TokenInterface, TransferChecked},
};
use spl_transfer_hook_interface::onchain::add_extra_accounts_for_execute_cpi;

use wen_new_standard::{
    cpi::{accounts::ApproveTransfer, approve_transfer},
    utils::get_mint_metadata,
    ROYALTY_BASIS_POINTS_FIELD,
};

use crate::{
    errors::MarketError,
    state::*,
    utils::{
        create_ata, get_amount_from_bp, get_bump_in_seed_form, get_fee_amount, invoke_unwrap_sol,
        invoke_wrap_sol, token_extensions::WnsApprovalAccounts, verify_wns_mint, UnwrapSolAccounts,
        WrapSolAccounts, WSOL_MINT,
    },
};

#[derive(Accounts)]
#[instruction()]
#[event_cpi]
pub struct FillOrder<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut, constraint = maker.key() == order.owner.key())]
    /// CHECK: constraint check
    pub maker: UncheckedAccount<'info>,
    #[account(
        constraint = Market::is_active(market.state),
        seeds = [MARKET_SEED,
        market.market_identifier.as_ref()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(
        mut,
        constraint = Order::is_active(order.state),
        constraint = order.market == market.key(),
        constraint = order.owner == maker.key(),
        seeds = [ORDER_SEED,
        order.nonce.as_ref(),
        order.market.as_ref(),
        order.owner.as_ref()],
        bump,
        close = maker
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(mut)]
    pub nft_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    /// CHECK: checked by create_ata function
    pub seller_nft_ta: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checked by create_ata function
    pub buyer_nft_ta: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub nft_token_program: Interface<'info, TokenInterface>,
    /// CHECK: checked by constraint and in cpi
    pub nft_program: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checked by create_ata function
    pub seller_payment_ta: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checked by create_ata function
    pub buyer_payment_ta: UncheckedAccount<'info>,
    #[account(mut, constraint = payment_mint.key() == order.payment_mint)]
    pub payment_mint: Box<InterfaceAccount<'info, Mint>>,
    pub payment_token_program: Interface<'info, TokenInterface>,
    /// CHECK: checked by constraint and in cpi
    #[account(address = sysvar::instructions::id())]
    pub sysvar_instructions: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> FillOrder<'info> {
    #[inline(never)]
    fn transfer_payment(&self, signer_seeds: &[&[&[u8]]], is_buy: bool, amount: u64) -> Result<()> {
        let cpi_ctx = if is_buy {
            CpiContext::new_with_signer(
                self.payment_token_program.to_account_info(),
                TransferChecked {
                    from: self.buyer_payment_ta.to_account_info(),
                    to: self.seller_payment_ta.to_account_info(),
                    authority: self.order.to_account_info(),
                    mint: self.payment_mint.to_account_info(),
                },
                signer_seeds,
            )
        } else {
            CpiContext::new(
                self.payment_token_program.to_account_info(),
                TransferChecked {
                    from: self.buyer_payment_ta.to_account_info(),
                    to: self.seller_payment_ta.to_account_info(),
                    authority: self.taker.to_account_info(),
                    mint: self.payment_mint.to_account_info(),
                },
            )
        };
        transfer_checked(cpi_ctx, amount, self.payment_mint.decimals)
    }

    /*
        Compressed Transfer Instructions
    */

    /*
        Token 22 Transfer Instructions
    */

    // WNS Pre-Transfer Approval
    #[inline(never)]
    fn approve_wns_transfer(
        &self,
        signer_seeds: &[&[&[u8]]],
        buy_amount: u64,
        is_buy: bool,
        wns_accounts: WnsApprovalAccounts<'info>,
    ) -> Result<()> {
        let cpi_program = self.nft_program.to_account_info();
        create_ata(
            &wns_accounts.distribution_token_account.to_account_info(),
            &self.taker.to_account_info(),
            &self.payment_mint.to_account_info(),
            &wns_accounts.distribution_account.to_account_info(),
            &self.system_program.to_account_info(),
            &self.payment_token_program.to_account_info(),
        )?;
        let cpi_ctx = if is_buy {
            let cpi_accounts = ApproveTransfer {
                payer: self.taker.to_account_info(),
                authority: self.order.to_account_info(),
                mint: self.nft_mint.to_account_info(),
                approve_account: wns_accounts.approval_account.to_account_info(),
                payment_mint: self.payment_mint.to_account_info(),
                distribution_token_account: Some(
                    wns_accounts.distribution_token_account.to_account_info(),
                ),
                authority_token_account: Some(self.buyer_payment_ta.to_account_info()),
                distribution_account: wns_accounts.distribution_account.to_account_info(),
                system_program: self.system_program.to_account_info(),
                distribution_program: wns_accounts.distribution_program.to_account_info(),
                token_program: self.nft_token_program.to_account_info(),
                payment_token_program: Some(self.payment_token_program.to_account_info()),
            };
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds)
        } else {
            let cpi_accounts = ApproveTransfer {
                payer: self.taker.to_account_info(),
                authority: self.taker.to_account_info(),
                mint: self.nft_mint.to_account_info(),
                approve_account: wns_accounts.approval_account.to_account_info(),
                payment_mint: self.payment_mint.to_account_info(),
                distribution_token_account: Some(
                    wns_accounts.distribution_token_account.to_account_info(),
                ),
                authority_token_account: Some(self.buyer_payment_ta.to_account_info()),
                distribution_account: wns_accounts.distribution_account.to_account_info(),
                system_program: self.system_program.to_account_info(),
                distribution_program: wns_accounts.distribution_program.to_account_info(),
                token_program: self.nft_token_program.to_account_info(),
                payment_token_program: Some(self.payment_token_program.to_account_info()),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        };
        approve_transfer(cpi_ctx, buy_amount)
    }

    // General Token22 Transfer
    #[inline(never)]
    fn token22_nft_transfer(
        &self,
        signer_seeds: &[&[&[u8]]],
        is_buy: bool,
        amount: u64,
        remaining_accounts: Vec<AccountInfo<'info>>,
    ) -> Result<()> {
        let authority_info = if is_buy {
            self.taker.to_account_info().clone()
        } else {
            self.order.to_account_info().clone()
        };

        let mut transfer_ix = transfer_2022(
            self.nft_token_program.key,
            self.seller_nft_ta.key,
            self.nft_mint.to_account_info().key,
            self.buyer_nft_ta.key,
            authority_info.key,
            &[],
            amount,
            0,
        )?;

        let mut account_infos = vec![
            self.seller_nft_ta.to_account_info().clone(),
            self.nft_mint.to_account_info().clone(),
            self.buyer_nft_ta.to_account_info().clone(),
            authority_info.clone(),
        ];

        if remaining_accounts.len() > 0 {
            // transfer hook
            let additional_account_infos = remaining_accounts.clone();

            let hook_program = remaining_accounts.clone().pop().unwrap();

            add_extra_accounts_for_execute_cpi(
                &mut transfer_ix,
                &mut account_infos,
                &hook_program.key,
                self.seller_nft_ta.to_account_info(),
                self.nft_mint.to_account_info(),
                self.buyer_nft_ta.to_account_info(),
                authority_info,
                amount,
                &additional_account_infos,
            )?;
        }

        anchor_lang::solana_program::program::invoke_signed(
            &transfer_ix,
            &account_infos,
            signer_seeds,
        )?;

        Ok(())
    }

    #[inline(never)]
    fn transfer_fee(
        &self,
        signer_seeds: &[&[&[u8]]],
        fee_accounts: Vec<AccountInfo<'info>>,
        is_buy: bool,
        fee_amounts: Vec<u64>,
    ) -> Result<()> {
        let authority = if is_buy {
            self.order.to_account_info()
        } else {
            self.taker.to_account_info()
        };

        let mut i = 0;
        for accounts in fee_accounts.chunks(2) {
            let amount = fee_amounts[i];
            i = i + 1;
            if accounts.len() == 2 {
                // Valid account pair
                let rec_pubkey = &accounts[0];
                if rec_pubkey.key().to_string() == Pubkey::default().to_string() {
                    continue;
                }
                let rec_ta = &accounts[1];
                create_ata(
                    &rec_ta.to_account_info(),
                    &self.taker.to_account_info(),
                    &self.payment_mint.to_account_info(),
                    &rec_pubkey.to_account_info(),
                    &self.system_program.to_account_info(),
                    &self.payment_token_program.to_account_info(),
                )?;
                let ctx = TransferChecked {
                    from: self.buyer_payment_ta.to_account_info(),
                    to: rec_ta.to_account_info(),
                    authority: authority.clone(),
                    mint: self.payment_mint.to_account_info(),
                };
                let cpi = if is_buy {
                    CpiContext::new_with_signer(
                        self.payment_token_program.to_account_info(),
                        ctx,
                        signer_seeds,
                    )
                } else {
                    CpiContext::new(self.payment_token_program.to_account_info(), ctx)
                };
                transfer_checked(cpi, amount, self.payment_mint.decimals)?;
            }
        }

        Ok(())
    }

    #[inline(never)]
    fn wrap_sol_if_needed(&self, amount: u64, is_buy: bool) -> Result<()> {
        if self.payment_mint.key() == WSOL_MINT && !is_buy {
            invoke_wrap_sol(
                &WrapSolAccounts {
                    user: self.taker.to_account_info(),
                    user_ta: self.buyer_payment_ta.to_account_info(),
                    token_program: self.payment_token_program.to_account_info(),
                    wsol_mint: self.payment_mint.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                amount,
            )?;
        }
        Ok(())
    }

    #[inline(never)]
    fn unwrap_sol_if_needed(&self, is_buy: bool) -> Result<()> {
        if self.payment_mint.key() == WSOL_MINT {
            let user_ta = if is_buy {
                self.seller_payment_ta.to_account_info()
            } else {
                self.buyer_payment_ta.to_account_info()
            };
            invoke_unwrap_sol(&UnwrapSolAccounts {
                user: self.taker.to_account_info(),
                user_ta,
                token_program: self.payment_token_program.to_account_info(),
            })?;
        }
        Ok(())
    }
}

/// Initializer is the buyer and is buying an nft from the seller
/// The seller is the owner of the order account
/// Buyer transfers sol to seller account
#[inline(never)]
pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, FillOrder<'info>>,
    amount: u64,
) -> Result<()> {
    let nft_token_program_key = &ctx.accounts.nft_token_program.key.to_string().clone();
    let nft_program_key = &ctx.accounts.nft_program.key.to_string().clone();

    let all_remaining_accounts = ctx.remaining_accounts.to_vec();
    // First 6 accounts reserved for accounts and their token accounts. Will be Pubkey default if they're non-existant
    let (fee_accounts, remaining_accounts) = all_remaining_accounts.split_at(6);

    // Ensure proper accounts and order passed in for fees
    ctx.accounts
        .market
        .verify_fee_accounts(fee_accounts.to_vec())?;

    let bump = &get_bump_in_seed_form(&ctx.bumps.order);

    let signer_seeds: &[&[&[u8]]; 1] = &[&[
        ORDER_SEED,
        ctx.accounts.order.nonce.as_ref(),
        ctx.accounts.order.market.as_ref(),
        ctx.accounts.order.owner.as_ref(),
        bump,
    ][..]];

    let buy_price = ctx.accounts.order.price;
    let order_size = ctx.accounts.order.size;

    if order_size < amount {
        return Err(MarketError::InsufficientOrderSize.into());
    }

    let buy_value = amount.checked_mul(buy_price).unwrap();

    let fee_amounts: [u64; 3] = ctx
        .accounts
        .market
        .fee_bps
        .map(|f| get_fee_amount(buy_value, f));
    let total_fee_amount: u64 = fee_amounts.iter().sum();

    let mut seller_received_amount = buy_value - total_fee_amount;

    let is_buy = ctx.accounts.order.side == 0;
    // Verify maker + taker accounts
    // Verify the buyer account

    let system_program = ctx.accounts.system_program.to_account_info();
    let nft_token_program = ctx.accounts.nft_token_program.to_account_info();
    let payment_token_program = ctx.accounts.payment_token_program.to_account_info();

    let nft_funder = if is_buy {
        ctx.accounts.taker.to_account_info()
    } else {
        ctx.accounts.maker.to_account_info()
    };
    create_ata(
        &ctx.accounts.seller_nft_ta.to_account_info(),
        &ctx.accounts.taker.to_account_info(),
        &ctx.accounts.nft_mint.to_account_info(),
        &nft_funder,
        &system_program,
        &nft_token_program,
    )?;

    let nft_receiver = if is_buy {
        ctx.accounts.maker.to_account_info()
    } else {
        ctx.accounts.taker.to_account_info()
    };
    create_ata(
        &ctx.accounts.buyer_nft_ta.to_account_info(),
        &ctx.accounts.taker.to_account_info(),
        &ctx.accounts.nft_mint.to_account_info(),
        &nft_receiver,
        &system_program,
        &nft_token_program,
    )?;

    let payment_funder = if is_buy {
        ctx.accounts.order.to_account_info()
    } else {
        ctx.accounts.taker.to_account_info()
    };
    create_ata(
        &ctx.accounts.buyer_payment_ta.to_account_info(),
        &ctx.accounts.taker.to_account_info(),
        &ctx.accounts.payment_mint.to_account_info(),
        &payment_funder,
        &system_program,
        &payment_token_program,
    )?;

    let payment_receiver = if is_buy {
        ctx.accounts.taker.to_account_info()
    } else {
        ctx.accounts.maker.to_account_info()
    };
    create_ata(
        &ctx.accounts.seller_payment_ta.to_account_info(),
        &ctx.accounts.taker.to_account_info(),
        &ctx.accounts.payment_mint.to_account_info(),
        &payment_receiver,
        &system_program,
        &payment_token_program,
    )?;

    ctx.accounts.wrap_sol_if_needed(buy_value, is_buy)?;

    // Transfer NFT
    if *nft_token_program_key == TOKEN_PID {
        // Check if its metaplex or not
        if *nft_program_key == METAPLEX_PID {
            // TODO
            return Err(MarketError::UnsupportedNft.into());
        } else {
            // Transfer compressed NFT
            // TODO
            return Err(MarketError::UnsupportedNft.into());
        }
    } else if *nft_token_program_key == TOKEN_EXT_PID {
        let mut token22_ra = remaining_accounts;
        // Check if its WNS
        if *nft_program_key == WNS_PID {
            // Remaining Accounts 0-2 for approval
            let approval_account = remaining_accounts.get(0).unwrap();
            let distribution_account = remaining_accounts.get(1).unwrap();
            let distribution_token_account = remaining_accounts.get(2).unwrap();
            let distribution_program = remaining_accounts.get(3).unwrap();
            let group_member_account = remaining_accounts.get(4).unwrap();
            let payment_mint = remaining_accounts.get(5).unwrap();

            verify_wns_mint(
                ctx.accounts.nft_mint.to_account_info(),
                group_member_account.to_account_info(),
                ctx.accounts.market.market_identifier.clone(),
            )?;

            let (_, extra_remaining_accounts) = remaining_accounts.split_at(6);
            token22_ra = extra_remaining_accounts;

            let wns_accounts = WnsApprovalAccounts {
                approval_account: approval_account.to_account_info(),
                distribution_account: distribution_account.to_account_info(),
                distribution_token_account: distribution_token_account.to_account_info(),
                distribution_program: distribution_program.to_account_info(),
                payment_mint: payment_mint.to_account_info(),
            };

            let mint_metadata = get_mint_metadata(&mut ctx.accounts.nft_mint.to_account_info())?;
            let royalty_basis_points = mint_metadata
                .additional_metadata
                .iter()
                .find(|(key, _)| key == ROYALTY_BASIS_POINTS_FIELD)
                .map(|(_, value)| value)
                .map(|value| u64::from_str(value).unwrap())
                .unwrap_or(0);

            let royalties = get_amount_from_bp(buy_value, royalty_basis_points.into())?;
            seller_received_amount = seller_received_amount.checked_sub(royalties).unwrap();

            // Handles royalties
            ctx.accounts
                .approve_wns_transfer(signer_seeds, buy_value, is_buy, wns_accounts)?;
        }
        // Any remaining accounts left are for potential transfer hook (Empty if not expecting hook)
        ctx.accounts
            .token22_nft_transfer(signer_seeds, is_buy, amount, token22_ra.to_vec())?;
    } else if *nft_token_program_key == BUBBLEGUM_PID {
        // Transfer compressed NFT
        // TODO
        return Err(MarketError::UnsupportedNft.into());
    } else {
        // ERROR
        return Err(MarketError::UnsupportedNft.into());
    }

    // Transfer payment
    ctx.accounts
        .transfer_payment(signer_seeds, is_buy, seller_received_amount)?;
    ctx.accounts.transfer_fee(
        signer_seeds,
        fee_accounts.to_vec(),
        is_buy,
        fee_amounts.to_vec(),
    )?;

    ctx.accounts.unwrap_sol_if_needed(is_buy)?;

    // close order account
    let size = ctx.accounts.order.size;
    let payment_mint = ctx.accounts.order.payment_mint;
    let clock = Clock::get()?;

    let new_size = size - amount;
    Order::edit_order(
        &mut ctx.accounts.order,
        buy_price,
        payment_mint,
        new_size,
        clock.unix_timestamp,
    );
    if new_size == 0 {
        ctx.accounts.order.state = OrderState::Closed.into();
        emit_cpi!(Order::get_edit_event(
            &mut ctx.accounts.order.clone(),
            ctx.accounts.order.key(),
            ctx.accounts.market.market_identifier,
            OrderEditType::FillAndClose,
        ));
        ctx.accounts
            .order
            .close(ctx.accounts.maker.to_account_info())?;
    }

    Ok(())
}
