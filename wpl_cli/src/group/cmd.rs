use crate::Context;

use super::asset::{collection_asset_subcommand, CollectionAssetSubCommand};
use super::create::{run as create_group_account, CreateArgs};
use super::get::{run as get_group_account, GetArgs};
use super::update::{run as update_group_account, UpdateArgs};

use anyhow::Result;
use clap::{Args, Subcommand};

#[derive(Debug, Clone, Args)]
pub struct GroupSubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    /// Create a collection
    #[clap(name = "create")]
    Create(CreateArgs),
    /// Update a collection
    #[clap(name = "update")]
    Update(UpdateArgs),
    /// Fetch a collection
    #[clap(name = "get")]
    Get(GetArgs),
    /// Asset grouping related instructions
    #[clap(name = "asset")]
    Asset(CollectionAssetSubCommand),
}

pub async fn subcommand(context: Context, subcommand: GroupSubCommand) -> Result<()> {
    match subcommand.action {
        Commands::Create(args) => {
            create_group_account(context, args).await?;
        }
        Commands::Update(args) => {
            update_group_account(context, args).await?;
        }
        Commands::Get(args) => {
            get_group_account(context, args).await?;
        }
        Commands::Asset(subcommand) => {
            collection_asset_subcommand(context, subcommand).await?;
        }
    }

    Ok(())
}
