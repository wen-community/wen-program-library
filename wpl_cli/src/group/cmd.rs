use crate::Context;

use super::asset::{collection_asset_subcommand, CollectionAssetSubCommand};
use super::create::{run as create_group_account, CreateArgs};
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
    #[clap(name = "create")]
    /// Create a collection
    Create(CreateArgs),
    #[clap(name = "update")]
    /// Update a collection
    Update(UpdateArgs),
    #[clap(name = "asset")]
    /// Asset grouping related instructions
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
        Commands::Asset(subcommand) => {
            collection_asset_subcommand(context, subcommand).await?;
        }
    }

    Ok(())
}
