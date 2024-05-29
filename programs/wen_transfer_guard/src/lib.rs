pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod tools;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4MrF8SuFtwGg53bL6KziCe7suvKqUoBg7o7Lnix1Ton5");

#[program]
pub mod wen_transfer_guard {
    use super::*;

    pub fn create_guard(ctx: Context<CreateGuard>, args: CreateGuardArgs) -> Result<()> {
        create_guard::processor(ctx, args)
    }

    #[interface(spl_transfer_hook_interface::initialize_extra_account_meta_list)]
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::processor(ctx)
    }

    #[interface(spl_transfer_hook_interface::execute)]
    pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
        execute::processor(ctx, amount)
    }
}
