use anchor_lang::prelude::*;

pub mod instructions;
pub mod utils;

pub use instructions::*;
pub use utils::*;

declare_id!("8e9NZefQowF1ViN4eiz8r3wgKw9xLESGkkQEZJWox49o");

#[program]
pub mod wen_new_standard {
    use super::*;

    /*
        Token mint instructions
    */

    /// create mint
    pub fn create_mint_account(
        ctx: Context<CreateMintAccount>,
        args: CreateMintAccountArgs,
    ) -> Result<()> {
        instructions::mint::create::handler(ctx, args)
    }
}
