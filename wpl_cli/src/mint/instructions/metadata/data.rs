use std::{
    fs::File,
    path::{Path, PathBuf},
};

use anyhow::Result;
use clap::Parser;
use log::warn;
use solana_sdk::pubkey::Pubkey;
use wen_new_standard::types::{AddMetadataArgs, RemoveMetadataArgs};

#[derive(Debug, Parser, Clone)]
pub struct MetadataArgs {
    /// Member mint
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
    /// Config file for metadata
    #[arg(short = 'M', long)]
    pub metadata_path: PathBuf,
}

pub fn parse_add_metadata_pairs(metadata_path: PathBuf) -> Result<Vec<AddMetadataArgs>> {
    if Path::new(&metadata_path).exists() {
        let metadata_config = File::open(metadata_path)?;
        let add_metadata_args = serde_json::from_reader(metadata_config)?;
        Ok(add_metadata_args)
    } else {
        warn!("Metadata config doesn't exist");
        Ok(vec![])
    }
}

pub fn parse_remove_metadata_pairs(metadata_path: PathBuf) -> Result<Vec<RemoveMetadataArgs>> {
    if Path::new(&metadata_path).exists() {
        let metadata_config = File::open(metadata_path)?;
        let remove_metadata_args = serde_json::from_reader(metadata_config)?;
        Ok(remove_metadata_args)
    } else {
        warn!("Metadata config doesn't exist");
        Ok(vec![])
    }
}
