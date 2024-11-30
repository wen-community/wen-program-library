use anchor_lang::prelude::*;

pub mod errors;
mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

// rAREXWkxUP9Cr91tRVJ29NumDAEKvNpDWZNqcfSwBNG - program id
declare_id!("4NSuQ6U7QdVqCW5gJY4a2U6X7s2qNvrUQUwTMsf6HARG");

#[program]
pub mod marketplace {

    use super::*;

    /// initializer a new market
    #[inline(never)]
    pub fn init_market(ctx: Context<InitMarket>, params: InitMarketParams) -> Result<()> {
        instructions::market::init::handler(ctx, params)
    }

    /// initializer a new market
    #[inline(never)]
    pub fn verify_mint(ctx: Context<VerifyMint>) -> Result<()> {
        instructions::market::verify_mint::handler(ctx)
    }

    /// initializer a new bid
    #[inline(never)]
    pub fn bid(ctx: Context<BidNft>, data: BidData) -> Result<()> {
        instructions::order::bid::handler(ctx, data)
    }

    /// initializer a new listing
    #[inline(never)]
    pub fn list<'info>(
        ctx: Context<'_, '_, '_, 'info, ListNft<'info>>,
        data: ListData,
    ) -> Result<()> {
        instructions::order::list::handler(ctx, data)
    }

    /// fill a listing
    #[inline(never)]
    pub fn fill_order<'info>(
        ctx: Context<'_, '_, '_, 'info, FillOrder<'info>>,
        amount: u64,
    ) -> Result<()> {
        instructions::order::fill::handler(ctx, amount)
    }

    /// cancel a buy order
    #[inline(never)]
    pub fn cancel_bid(ctx: Context<CancelBid>) -> Result<()> {
        instructions::order::cancel_bid::handler(ctx)
    }

    /// cancel a sell order
    #[inline(never)]
    pub fn cancel_listing<'info>(
        ctx: Context<'_, '_, '_, 'info, CancelListing<'info>>,
    ) -> Result<()> {
        instructions::order::cancel_list::handler(ctx)
    }
}
