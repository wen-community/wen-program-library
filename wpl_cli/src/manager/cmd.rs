use super::init::run as init_manager_account;
use crate::Context;

use anyhow::Result;
use clap::{Args, Subcommand};

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

pub async fn subcommand(context: Context, subcommand: ManagerSubCommand) -> Result<()> {
    match subcommand.action {
        Commands::Init => {
            init_manager_account(context).await?;
        }
    }

    Ok(())
}
