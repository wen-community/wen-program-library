use crate::asset::*;
use crate::group::*;
use crate::manager::*;

use clap::{Parser, Subcommand};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::signature::Keypair;

#[derive(Debug, Parser)]
#[command(
    author,
    version,
    name = "Wen New Standard",
    about = "An open and composable NFT standard on Solana."
)]
pub struct Args {
    /// RPC endpoint url to override using the Solana config
    #[arg(short, long, global = true)]
    pub rpc: Option<String>,

    /// Timeout to override default value of 90 seconds
    #[arg(short = 'T', long, global = true, default_value_t = 90)]
    pub timeout: u64,

    /// Log level
    #[arg(short, long, global = true, default_value = "off")]
    pub log_level: String,

    /// Path to the owner keypair file
    #[arg(short, long, global = true)]
    pub keypair: Option<String>,

    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    /// Manager related instructions
    #[clap(name = "manager")]
    Manager(ManagerSubCommand),
    /// Collection related instructions
    #[clap(name = "collection")]
    Group(GroupSubCommand),
    /// Asset related instructions
    #[clap(name = "asset")]
    Asset(AssetSubcommand),
}

pub struct Context {
    pub client: RpcClient,
    pub keypair: Keypair,
}
