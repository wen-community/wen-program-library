use super::{add::run as add_mint, remove::run as remove_mint, MintArgs};

use anyhow::Result;
use clap::{Args, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

#[derive(Debug, Clone, Args)]
pub struct GroupMintSubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "add")]
    /// Add a member mint account to a group (collection)
    Add(MintArgs),
    #[clap(name = "remove")]
    /// Remove a member mint account from a group (collection)
    Remove(MintArgs),
}

pub async fn subcommand(
    async_client: RpcClient,
    keypair: Keypair,
    subcommand: GroupMintSubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Add(args) => {
            add_mint(async_client, keypair, args).await?;
        }
        Commands::Remove(args) => {
            remove_mint(async_client, keypair, args).await?;
        }
    }

    Ok(())
}
