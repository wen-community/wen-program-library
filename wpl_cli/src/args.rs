use crate::group::*;
use crate::manager::*;
use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[clap(author, version)]
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
    #[arg(short, long)]
    pub keypair: Option<String>,

    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    #[clap(name = "manager")]
    Manager(ManagerSubCommand),
    #[clap(name = "group")]
    Group(GroupSubCommand),
}
