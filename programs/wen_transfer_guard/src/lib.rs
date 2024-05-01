pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4MrF8SuFtwGg53bL6KziCe7suvKqUoBg7o7Lnix1Ton5");

#[program]
pub mod wen_transfer_guard {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
}
