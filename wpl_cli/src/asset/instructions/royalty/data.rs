use anyhow::Result;
use log::warn;
use std::{
    fs::File,
    path::{Path, PathBuf},
};

use clap::Parser;
use solana_sdk::pubkey::Pubkey;
use wen_new_standard::types::UpdateRoyaltiesArgs;

#[derive(Debug, Parser, Clone)]
pub struct RoyaltyArgs {
    /// Asset address
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
    /// Config file for royalties
    #[arg(short, long)]
    pub config_path: PathBuf,
}

pub fn parse_update_royalties_args(config_path: PathBuf) -> Result<UpdateRoyaltiesArgs> {
    if Path::new(&config_path).exists() {
        let royalty_config = File::open(config_path)?;
        let update_royalties_args = serde_json::from_reader(royalty_config)?;
        Ok(update_royalties_args)
    } else {
        warn!("Royalties config doesn't exist");
        Ok(UpdateRoyaltiesArgs {
            creators: vec![],
            royalty_basis_points: 0,
        })
    }
}
