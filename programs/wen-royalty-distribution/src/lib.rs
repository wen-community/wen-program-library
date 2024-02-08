use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use errors::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

declare_id!("8fZkX7UXQ8iGes5evhScXjrGfaVgJc76QZiQVWBtLyhc");

#[program]
pub mod wen_royalty_distribution {

    use super::*;

    /// Initializes a new distribution account.
    pub fn initialize_distribution(ctx: Context<InitializeDistribution>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Update royalty amount for creators a distribution account.
    pub fn update_distribution(
        ctx: Context<UpdateDistribution>,
        args: UpdateDistributionArgs,
    ) -> Result<()> {
        instructions::update::handler(ctx, args)
    }

    /// Claim royalties from a distribution account.
    pub fn claim_distribution(ctx: Context<ClaimDistribution>, payment_mint: Pubkey) -> Result<()> {
        instructions::claim::handler(ctx, payment_mint)
    }
}
