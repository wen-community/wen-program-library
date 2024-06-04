use super::create::{run as create_group_account, CreateArgs};
use super::asset::{collection_asset_subcommand, CollectionAssetSubCommand};
use super::update::{run as update_group_account, UpdateArgs};

use anyhow::Result;
use clap::{Args, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

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
    #[clap(name = "mint")]
    /// Asset grouping related instructions
    Asset(CollectionAssetSubCommand),
}

pub async fn subcommand(
    client: RpcClient,
    keypair: Keypair,
    subcommand: GroupSubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Create(args) => {
            create_group_account(client, keypair, args).await?;
        }
        Commands::Update(args) => {
            update_group_account(client, keypair, args).await?;
        }
        Commands::Asset(subcommand) => {
            collection_asset_subcommand(client, keypair, subcommand).await?;
        }
    }

    Ok(())
}
