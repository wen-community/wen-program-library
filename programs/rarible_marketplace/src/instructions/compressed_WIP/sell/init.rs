use anchor_lang::prelude::*;

use mpl_bubblegum::instructions::{TransferCpiAccounts, TransferInstructionArgs};

use crate::{instructions::compressed_draft::CompressedOrderData, state::*};

#[derive(Accounts)]
#[instruction(data: CompressedOrderData)]
#[event_cpi]
pub struct CompressedInitSellOrder<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [WALLET_SEED,
        initializer.key().as_ref()],
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
        constraint = data.price > 0,
        init,
        seeds = [ORDER_SEED,
        data.order_nonce.as_ref(),
        market.key().as_ref(),
        initializer.key().as_ref()],
        bump,
        payer = initializer,
        space = 8 + std::mem::size_of::<Order>()
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        seeds = [APPRAISAL_SEED, market.market_identifier.as_ref(), data.mint_id.as_ref()],
        bump,
        seeds::program = vault::ID,
    )]
    pub appraisal: Box<Account<'info, Appraisal>>,
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

impl<'info> CompressedInitSellOrder<'info> {
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
            nonce,
            index,
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

#[inline(always)]
pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CompressedInitSellOrder<'info>>,
    data: CompressedOrderData,
) -> Result<()> {
    msg!("Initialize a new sell order: {}", ctx.accounts.order.key());

    let clock = Clock::get()?;
    // create a new order with size 1
    Order::init(
        &mut ctx.accounts.order,
        ctx.accounts.market.key(),
        ctx.accounts.initializer.key(),
        ctx.accounts.wallet.key(),
        data.order_nonce,
        data.mint_id,
        clock.unix_timestamp,
        OrderSide::Sell.into(),
        1, // always 1
        data.price,
        OrderState::Ready.into(),
        true,
    );

    ctx.accounts.transfer_compressed_nft(
        ctx.remaining_accounts.to_vec(),
        data.root,
        data.data_hash,
        data.creator_hash,
        data.index as u64,
        data.index,
    )?;

    emit_cpi!(Order::get_edit_event(
        &mut ctx.accounts.order.clone(),
        ctx.accounts.order.key(),
        ctx.accounts.market.market_identifier,
        OrderEditType::Init,
    ));

    Ok(())
}
