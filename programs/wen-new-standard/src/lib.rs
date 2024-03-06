#![allow(ambiguous_glob_reexports)]

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use errors::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

declare_id!("wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM");

#[program]
pub mod wen_new_standard {
    use super::*;

    /*
        Manager instructions
    */
    /// Init manager account
    pub fn init_manager_account(ctx: Context<InitManagerAccount>) -> Result<()> {
        instructions::manager::init::handler(ctx)
    }

    /*
        Token group instructions
    */
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

    /// add mint to group
    pub fn add_group_to_mint(ctx: Context<AddGroup>) -> Result<()> {
        instructions::mint::group::add::handler(ctx)
    }

    /// add royalties to mint
    pub fn add_royalties_to_mint(ctx: Context<AddRoyalties>, args: AddRoyaltiesArgs) -> Result<()> {
        instructions::mint::royalties::add::handler(ctx, args)
    }

    /*
        Royalty distribution + enforcement instructions
    */
    /// validate transfer
    #[interface(spl_transfer_hook_interface::execute)]
    pub fn execute(ctx: Context<ExecuteTransferHook>, _amount: u64) -> Result<()> {
        instructions::royalty::execute::handler(ctx)
    }

    /// approve transfer
    pub fn approve(ctx: Context<ApproveTransfer>, amount: u64) -> Result<()> {
        instructions::royalty::approve::handler(ctx, amount)
    }
}
