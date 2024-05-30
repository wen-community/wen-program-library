use super::create::{run as create_mint_account, CreateArgs};
use super::freeze::{run as freeze_mint_account, FreezeArgs};
use super::metadata::{metadata_subcommand, MetadataSubCommand};
use super::royalty::{royalty_subcommand, RoyaltySubCommand};
use super::thaw::{run as thaw_mint_account, ThawArgs};

use anyhow::Result;
use clap::{Args, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

#[derive(Debug, Clone, Args)]
pub struct MintSubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "create")]
    /// Create a new mint account (member)
    Create(CreateArgs),
    #[clap(name = "freeze")]
    /// Freeze a mint account (member)
    Freeze(FreezeArgs),
    #[clap(name = "thaw")]
    /// Thaw a mint account (member)
    Thaw(ThawArgs),
    #[clap(name = "royalty")]
    /// Royalty based instructions for a mint account (member)
    Royalty(RoyaltySubCommand),
    #[clap(name = "metadata")]
    /// Metadata based instructions for a mint account (member)
    Metadata(MetadataSubCommand),
}

pub async fn subcommand(
    async_client: RpcClient,
    keypair: Keypair,
    subcommand: MintSubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Create(args) => {
            create_mint_account(async_client, keypair, args).await?;
        }
        Commands::Royalty(subcommand) => {
            royalty_subcommand(async_client, keypair, subcommand).await?;
        }
        Commands::Metadata(subcommand) => {
            metadata_subcommand(async_client, keypair, subcommand).await?;
        }
        Commands::Freeze(args) => {
            freeze_mint_account(async_client, keypair, args).await?;
        }
        Commands::Thaw(args) => {
            thaw_mint_account(async_client, keypair, args).await?;
        }
    }

    Ok(())
}
