use crate::Context;

use super::{add::run as add_mint, remove::run as remove_mint, AssetArgs};

use anyhow::Result;
use clap::{Args, Subcommand};

#[derive(Debug, Clone, Args)]
pub struct CollectionAssetSubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "add")]
    /// Add an asset to a collection
    Add(AssetArgs),
    #[clap(name = "remove")]
    /// Remove an asset from a collection
    Remove(AssetArgs),
}

pub async fn subcommand(context: Context, subcommand: CollectionAssetSubCommand) -> Result<()> {
    match subcommand.action {
        Commands::Add(args) => {
            add_mint(context, args).await?;
        }
        Commands::Remove(args) => {
            remove_mint(context, args).await?;
        }
    }

    Ok(())
}
