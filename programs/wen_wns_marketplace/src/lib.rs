#![allow(ambiguous_glob_reexports)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use instructions::*;

declare_id!("sALEeD9VGNquoGSXvUAKLeVbXdjiPCb3FTuTm1xSLod");

#[program]
pub mod wen_wns_marketplace {
    use super::*;

    /* region LISTING INSTRUCTIONS (CORE LOGIC) */
    pub fn list(ctx: Context<ListNFT>, args: ListNFTArgs) -> Result<()> {
        listing::list::handler(ctx, args)
    }

    pub fn unlist(ctx: Context<UnlistNFT>) -> Result<()> {
        listing::unlist::handler(ctx)
    }

    pub fn buy(ctx: Context<FulfillListing>, args: FulfillListingArgs) -> Result<()> {
        listing::buy::handler(ctx, args)
    }

    pub fn buy_transfer_guard<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, FulfillListingTransferGuard<'info>>,
        args: FulfillListingTransferGuardArgs,
    ) -> Result<()> {
        listing::buy_transfer_guard::handler(ctx, args)
    }
    /* endregion */

    /* region CLAIM ROYALTY */
    pub fn claim_royalty(ctx: Context<ClaimRoyalty>) -> Result<()> {
        listing::royalty::handler(ctx)
    }
    /* endregion */
}
