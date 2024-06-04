use super::{add::run as add_mint, remove::run as remove_mint, AssetArgs};

use anyhow::Result;
use clap::{Args, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

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

pub async fn subcommand(
    client: RpcClient,
    keypair: Keypair,
    subcommand: CollectionAssetSubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Add(args) => {
            add_mint(client, keypair, args).await?;
        }
        Commands::Remove(args) => {
            remove_mint(client, keypair, args).await?;
        }
    }

    Ok(())
}
