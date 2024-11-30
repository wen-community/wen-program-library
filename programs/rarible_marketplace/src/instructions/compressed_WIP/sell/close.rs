use anchor_lang::prelude::*;
use mpl_bubblegum::instructions::{TransferCpiAccounts, TransferInstructionArgs};

use crate::{instructions::compressed_draft::CompressedOrderData, state::*};

#[derive(Accounts)]
#[instruction()]
#[event_cpi]
pub struct CompressedCloseSellOrder<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        constraint = order.owner == initializer.key(),
        constraint = order.market == market.key(),
        constraint = Order::is_active(order.state),
        seeds = [ORDER_SEED,
        order.nonce.as_ref(),
        order.market.as_ref(),
        initializer.key().as_ref()],
        bump,
        close = initializer,
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        constraint = Market::is_active(market.state),
        seeds = [MARKET_SEED,
        market.market_identifier.as_ref()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(
        mut,
        seeds = [WALLET_SEED,
        order.owner.as_ref()],
        bump,
    )]
    pub wallet: Box<Account<'info, Wallet>>,
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

impl<'info> CompressedCloseSellOrder<'info> {
    pub fn transfer_compressed_nft(
        &self,
        ra: Vec<AccountInfo<'info>>,
        signer_seeds: &[&[&[u8]]],
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
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
            nonce: index as u64,
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
            signer_seeds,
            args,
        )
    }
}

#[inline(always)]
pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CompressedCloseSellOrder<'info>>,
    data: CompressedOrderData,
) -> Result<()> {
    msg!("Close sell order account: {}", ctx.accounts.order.key());

    let bump = &get_bump_in_seed_form(&ctx.bumps.wallet);

    let signer_seeds = &[&[WALLET_SEED, ctx.accounts.order.owner.as_ref(), bump][..]];

    ctx.accounts.transfer_compressed_nft(
        ctx.remaining_accounts.to_vec(),
        signer_seeds,
        data.root,
        data.data_hash,
        data.creator_hash,
        data.index,
    )?;

    ctx.accounts.order.state = OrderState::Closed.into();

    emit_cpi!(Order::get_edit_event(
        &mut ctx.accounts.order.clone(),
        ctx.accounts.order.key(),
        ctx.accounts.market.market_identifier,
        OrderEditType::Close,
    ));
    Ok(())
}
