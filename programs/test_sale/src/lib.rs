#![allow(ambiguous_glob_reexports)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use instructions::*;

declare_id!("saLeHtY1jcSpuy5NKGX4pryocQ51WGUYqSSCKJNsgrP");

#[program]
pub mod test_sale {
    use super::*;

    /* region TEST PREP INSTRUCTIONS (NO CORE LOGIC) */
    pub fn initalize_prep_group(
        ctx: Context<InitializePrepGroup>,
        args: InitializePrepGroupArgs,
    ) -> Result<()> {
        prep::group::handler(ctx, args)
    }

    pub fn initalize_prep_mint(
        ctx: Context<InitializePrepMint>,
        args: InitializePrepMintArgs,
    ) -> Result<()> {
        prep::mint::handler(ctx, args)
    }

    pub fn initalize_prep_spl(ctx: Context<InitializePrepSPL>) -> Result<()> {
        prep::spl::handler(ctx)
    }
    /* endregion */

    /* region LISTING INSTRUCTIONS (CORE LOGIC) */
    pub fn list_nft(ctx: Context<ListNFT>, args: ListNFTArgs) -> Result<()> {
        listing::list::handler(ctx, args)
    }

    pub fn unlist_nft(ctx: Context<UnlistNFT>) -> Result<()> {
        listing::unlist::handler(ctx)
    }

    pub fn fulfill_listing(ctx: Context<FulfillListing>, args: FulfillListingArgs) -> Result<()> {
        listing::fulfill::handler(ctx, args)
    }
    /* endregion */

    /* region CLAIM ROYALTY */
    pub fn claim_royalty(ctx: Context<ClaimRoyalty>) -> Result<()> {
        listing::royalty::handler(ctx)
    }
    /* endregion */
}

#[derive(Accounts)]
pub struct Initialize {}
