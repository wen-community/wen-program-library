use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke, system_instruction::transfer},
};
use mpl_bubblegum::instructions::{TransferCpiAccounts, TransferInstructionArgs};

use crate::{instructions::compressed_draft::CompressedFillOrderData, state::*};

#[derive(Accounts)]
#[instruction()]
#[event_cpi]
pub struct CompressedFillBuyOrder<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        constraint = order.owner == buyer.key(),
    )]
    /// CHECK: constraint check
    pub buyer: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [WALLET_SEED,
        order.owner.as_ref()],
        bump,
    )]
    pub wallet: Box<Account<'info, Wallet>>,
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
        seeds = [ORDER_SEED,
        order.nonce.as_ref(),
        order.market.as_ref(),
        order.owner.as_ref()],
        bump,
    )]
    pub order: Box<Account<'info, Order>>,
    /// CHECK: checked in cpi
    pub tree_config: UncheckedAccount<'info>,
    /// CHECK: checked in cpi
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,
    /// CHECK: checked in cpi
    pub log_wrapper: UncheckedAccount<'info>,
    /// CHECK: checked in cpi
    pub compression_program: UncheckedAccount<'info>,
    /// CHECK: checked in cpi
    pub mpl_bubblegum: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> CompressedFillBuyOrder<'info> {
    pub fn transfer_compressed_nft(
        &self,
        ra: Vec<AccountInfo<'info>>,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
    ) -> Result<()> {
        let cpi_accounts = TransferCpiAccounts {
            tree_config: &self.tree_config.to_account_info(),
            leaf_owner: (&self.initializer.to_account_info(), true),
            leaf_delegate: (&self.initializer.to_account_info(), false),
            new_leaf_owner: &self.wallet.to_account_info(),
            merkle_tree: &self.merkle_tree.to_account_info(),
            log_wrapper: &self.log_wrapper.to_account_info(),
            compression_program: &self.compression_program.to_account_info(),
            system_program: &self.system_program.to_account_info(),
        };

        let args = TransferInstructionArgs {
            root,
            data_hash,
            creator_hash,
            index,
            nonce,
        };

        let transformed: Vec<(&AccountInfo, bool, bool)> = ra
            .iter()
            .map(|account| (account, account.is_signer, account.is_writable))
            .collect();

        let transformed_slice: &[(&AccountInfo, bool, bool)] = &transformed;
        compressed_transfer(
            self.mpl_bubblegum.to_account_info(),
            cpi_accounts,
            transformed_slice,
            &[],
            args,
        )
    }
}

/// seller is initializer and is transferring the nft to buyer who is the owner of the order account
/// buyer is the owner of the order account and is transferring sol to seller via bidding wallet
#[inline(always)]
pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CompressedFillBuyOrder<'info>>,
    data: CompressedFillOrderData,
) -> Result<()> {
    // edit wallet account to decrease balance
    let wallet_account = ctx.accounts.wallet.to_account_info();
    msg!("Edit wallet balance: {}", wallet_account.key());
    Wallet::edit_balance(&mut ctx.accounts.wallet, false, ctx.accounts.order.price);

    ctx.accounts.transfer_compressed_nft(
        ctx.remaining_accounts.to_vec(),
        data.root,
        data.data_hash,
        data.creator_hash,
        data.index as u64,
        data.index,
    )?;

    // transfer sol from buyer to seller
    invoke(
        &transfer(
            &wallet_account.key(),
            &ctx.accounts.initializer.key(),
            ctx.accounts.order.price,
        ),
        &[
            wallet_account,
            ctx.accounts.initializer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // edit order
    let price = ctx.accounts.order.price;
    let size = ctx.accounts.order.size;

    let clock = Clock::get()?;
    Order::edit_buy(
        &mut ctx.accounts.order,
        price,
        size - 1,
        clock.unix_timestamp,
    );

    if size == 1 {
        // close order account
        msg!(
            "Close buy order account: {}: {}",
            ctx.accounts.order.key(),
            ctx.accounts.market.market_identifier
        );
        emit_cpi!(Order::get_edit_event(
            &mut ctx.accounts.order.clone(),
            ctx.accounts.order.key(),
            ctx.accounts.market.market_identifier,
            OrderEditType::FillAndClose,
        ));
        ctx.accounts.order.state = OrderState::Closed.into();
        ctx.accounts
            .order
            .close(ctx.accounts.buyer.to_account_info())?;
    } else {
        emit_cpi!(Order::get_edit_event(
            &mut ctx.accounts.order.clone(),
            ctx.accounts.order.key(),
            ctx.accounts.market.market_identifier,
            OrderEditType::Fill,
        ));
        msg!("Filled buy order: {}", ctx.accounts.order.key());
    }

    Ok(())
}
