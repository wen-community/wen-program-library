use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use errors::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

declare_id!("diste3nXmK7ddDTs1zb6uday6j4etCa9RChD8fJ1xay");

#[program]
pub mod wen_royalty_distribution {

    use super::*;

    /// Initializes a new distribution account.
    pub fn initialize_distribution(
        ctx: Context<InitializeDistribution>,
        payment_mint: Pubkey,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, payment_mint)
    }

    /// Update royalty amount for creators a distribution account.
    pub fn update_distribution(
        ctx: Context<UpdateDistribution>,
        args: UpdateDistributionArgs,
    ) -> Result<()> {
        instructions::update::handler(ctx, args)
    }

    /// Claim royalties from a distribution account.
    pub fn claim_distribution(ctx: Context<ClaimDistribution>) -> Result<()> {
        instructions::claim::handler(ctx)
    }

    /// Resize old accounts for backwards compatibility.
    pub fn resize_distribution(ctx: Context<ResizeDistribution>) -> Result<()> {
        instructions::resize::handler(ctx)
    }
}
