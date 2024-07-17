use crate::Context;

use super::{add::run as add_metadata, remove::run as remove_metadata, MetadataArgs};

use anyhow::Result;
use clap::{Args, Subcommand};

#[derive(Debug, Clone, Args)]
pub struct MetadataSubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "add")]
    /// Add metadata for an asset
    Add(MetadataArgs),
    #[clap(name = "remove")]
    /// Remove metadata for an asset
    Remove(MetadataArgs),
}

pub async fn subcommand(context: Context, subcommand: MetadataSubCommand) -> Result<()> {
    match subcommand.action {
        Commands::Add(args) => {
            add_metadata(context, args).await?;
        }
        Commands::Remove(args) => {
            remove_metadata(context, args).await?;
        }
    }

    Ok(())
}
