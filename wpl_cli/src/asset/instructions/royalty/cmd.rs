use crate::Context;

use super::add::run as add_royalties;
use super::modify::run as modify_royalties;

use anyhow::Result;
use clap::{Args, Subcommand};

use super::data::RoyaltyArgs;

#[derive(Debug, Clone, Args)]
pub struct RoyaltySubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "add")]
    /// Add royalties for an asset
    Add(RoyaltyArgs),
    /// Modify royalties for an asset
    Modify(RoyaltyArgs),
}

pub async fn subcommand(context: Context, subcommand: RoyaltySubCommand) -> Result<()> {
    match subcommand.action {
        Commands::Add(args) => {
            add_royalties(context, args).await?;
        }
        Commands::Modify(args) => {
            modify_royalties(context, args).await?;
        }
    }

    Ok(())
}
