use anchor_lang::prelude::*;

pub mod instructions;

pub use instructions::*;

declare_id!("8e9NZefQowF1ViN4eiz8r3wgKw9xLESGkkQEZJWox49o");

#[program]
pub mod wen_new_standard {
    use super::*;

    /*
        Token mint instructions
    */

    /// Mint new NFT
    pub fn mint(
        ctx: Context<MintNft>,
        args: MintArgs,
    ) -> Result<()> {
        instructions::token::mint::handler(ctx, args)
    }
}
