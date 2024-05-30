use super::create::{run as create_group_account, CreateArgs};
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
    /// Create a new group account (collection)
    Create(CreateArgs),
    #[clap(name = "update")]
    /// Update a group account (collection)
    Update(UpdateArgs),
}

pub async fn subcommand(
    async_client: RpcClient,
    keypair: Keypair,
    subcommand: GroupSubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Create(args) => {
            create_group_account(async_client, keypair, args).await?;
        }
        Commands::Update(args) => {
            update_group_account(async_client, keypair, args).await?;
        }
    }

    Ok(())
}
