use super::add::run as add_royalties;
use super::modify::run as modify_royalties;

use anyhow::Result;
use clap::{Args, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

use super::data::RoyaltyArgs;

#[derive(Debug, Clone, Args)]
pub struct RoyaltySubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "add")]
    /// Add royalties for a mint account (member)
    Add(RoyaltyArgs),
    /// Modify royalties for a mint account (member)
    Modify(RoyaltyArgs),
}

pub async fn subcommand(
    async_client: RpcClient,
    keypair: Keypair,
    subcommand: RoyaltySubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Add(args) => {
            add_royalties(async_client, keypair, args).await?;
        }
        Commands::Modify(args) => {
            modify_royalties(async_client, keypair, args).await?;
        }
    }

    Ok(())
}
