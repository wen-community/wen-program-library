mod asset;

use tokio;
use asset::{subcommand as asset_subcommand, AssetCommand};
use anyhow::Result;
use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[clap(author, version)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    #[clap(name = "asset")]
    Asset(AssetCommand),
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    env_logger::init();

    match args.command {
        Command::Asset(subcommand) => asset_subcommand(subcommand).await?,
    }

    Ok(())
}
