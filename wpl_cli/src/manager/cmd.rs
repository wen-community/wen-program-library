use super::init::run as init_manager_account;

use anyhow::Result;
use clap::{Args, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

#[derive(Debug, Clone, Args)]
pub struct ManagerSubCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "init")]
    Init,
}

pub async fn subcommand(
    client: RpcClient,
    keypair: Keypair,
    subcommand: ManagerSubCommand,
) -> Result<()> {
    match subcommand.action {
        Commands::Init => {
            init_manager_account(client, keypair).await?;
        }
    }

    Ok(())
}
