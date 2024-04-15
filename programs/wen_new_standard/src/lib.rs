#![allow(ambiguous_glob_reexports)]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod token_22_cpi;
pub mod utils;

pub use errors::*;
pub use instructions::*;
pub use state::*;
pub use token_22_cpi::*;
pub use utils::*;

declare_id!("wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM");

#[program]
pub mod wen_new_standard {
    use super::*;

    /*
        Manager instructions
    */
    /// Init manager account
    pub fn init_manager_account(_ctx: Context<InitManagerAccount>) -> Result<()> {
        // create manager happens in the macro, no extra processor needed
        Ok(())
    }

    /// Token group instructions
    /// create group
    pub fn create_group_account(
        ctx: Context<CreateGroupAccount>,
        args: CreateGroupAccountArgs,
    ) -> Result<()> {
        instructions::group::create::handler(ctx, args)
    }

    /// update group
    pub fn update_group_account(
        ctx: Context<UpdateGroupAccount>,
        args: UpdateGroupAccountArgs,
    ) -> Result<()> {
        instructions::group::update::handler(ctx, args)
    }

    /// create mint
    pub fn create_mint_account(
        ctx: Context<CreateMintAccount>,
        args: CreateMintAccountArgs,
    ) -> Result<()> {
        instructions::mint::create::handler(ctx, args)
    }

    /// add mint to group
    pub fn add_mint_to_group(ctx: Context<AddGroup>) -> Result<()> {
        instructions::mint::group::add::handler(ctx)
    }

    /// add royalties to mint
    pub fn add_royalties(ctx: Context<AddRoyalties>, args: UpdateRoyaltiesArgs) -> Result<()> {
        instructions::mint::royalties::add::handler(ctx, args)
    }

    /// modify royalties of mint
    pub fn modify_royalties(
        ctx: Context<ModifyRoyalties>,
        args: UpdateRoyaltiesArgs,
    ) -> Result<()> {
        instructions::mint::royalties::modify::handler(ctx, args)
    }

    /// add additional metadata to mint
    pub fn add_metadata(ctx: Context<AddMetadata>, args: Vec<AddMetadataArgs>) -> Result<()> {
        instructions::mint::metadata::add::handler(ctx, args)
    }

    /// remove additional metadata to mint
    pub fn remove_metadata(
        ctx: Context<RemoveMetadata>,
        args: Vec<RemoveMetadataArgs>,
    ) -> Result<()> {
        instructions::mint::metadata::remove::handler(ctx, args)
    }

    /// freeze mint
    pub fn freeze_mint_account(ctx: Context<FreezeDelegatedAccount>) -> Result<()> {
        instructions::mint::freeze::handler(ctx)
    }

    /// thaw mint
    pub fn thaw_mint_account(ctx: Context<ThawDelegatedAccount>) -> Result<()> {
        instructions::mint::thaw::handler(ctx)
    }

    /// burn mint
    pub fn burn_mint_account(ctx: Context<BurnMintAccount>) -> Result<()> {
        instructions::mint::burn::handler(ctx)
    }

    /// Royalty distribution + enforcement instructions
    /// validate transfer
    #[interface(spl_transfer_hook_interface::execute)]
    pub fn execute(ctx: Context<ExecuteTransferHook>, _amount: u64) -> Result<()> {
        instructions::royalty::execute::handler(ctx)
    }

    /// approve transfer
    pub fn approve_transfer(ctx: Context<ApproveTransfer>, buy_amount: u64) -> Result<()> {
        instructions::royalty::approve::handler(ctx, buy_amount)
    }
}
