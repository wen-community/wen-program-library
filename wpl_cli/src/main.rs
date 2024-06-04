#![allow(ambiguous_glob_reexports)]

pub mod args;
pub mod group;
pub mod manager;
pub mod mint;
pub mod utils;

use std::{str::FromStr, time::Duration};

use anyhow::{anyhow, Result};
use args::*;
use clap::Parser;
use solana_cli_config::{Config, CONFIG_FILE};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;

use group::subcommand as group_subcommand;
use manager::subcommand as manager_subcommand;
use mint::subcommand as mint_subcommand;
use utils::parse_keypair;

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    env_logger::builder()
        .filter_level(log::LevelFilter::Info)
        .parse_default_env()
        .init();

    let config_file = CONFIG_FILE
        .as_ref()
        .ok_or_else(|| anyhow!("unable to get config file path"))?;

    let mut cli_config = Config::load(config_file)?;

    cli_config.json_rpc_url = if let Some(custom_json_rpc_url) = args.rpc {
        custom_json_rpc_url
    } else {
        cli_config.json_rpc_url
    };

    cli_config.keypair_path = if let Some(custom_keypair_path) = args.keypair {
        custom_keypair_path
    } else {
        cli_config.keypair_path
    };

    cli_config.save(config_file)?;

    let async_client = RpcClient::new_with_timeout_and_commitment(
        cli_config.json_rpc_url.clone(),
        Duration::from_secs(args.timeout),
        CommitmentConfig::from_str(&cli_config.commitment)?,
    );
    let keypair = parse_keypair(&cli_config.keypair_path)?;

    match args.command {
        Command::Manager(subcommand) => {
            manager_subcommand(async_client, keypair, subcommand).await?
        }
        Command::Group(subcommand) => group_subcommand(async_client, keypair, subcommand).await?,
        Command::Mint(subcommand) => mint_subcommand(async_client, keypair, subcommand).await?,
    }

    Ok(())
}
