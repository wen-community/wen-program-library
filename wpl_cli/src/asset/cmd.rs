use super::create;

use anyhow::Result;
use clap::{Args, Subcommand};

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[clap(name = "create")]
    Create(create::Args),
}

#[derive(Debug, Clone, Args)]
pub struct AssetCommand {
    #[clap(subcommand)]
    pub action: Commands,
}

pub async fn subcommand(subcommand: AssetCommand) -> Result<()> {
    match subcommand.action {
        Commands::Create(args) => {
            create::run(args).await?;
        }
    }

    Ok(())
}