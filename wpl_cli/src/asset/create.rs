use anyhow::Result;

use clap::Parser;

#[derive(Debug, Parser, Clone)]
pub struct Args {
}

pub async fn run(config: Args) -> Result<()> {
    log::info!("Creating a WNS asset. LFG!");

    Ok(())
}