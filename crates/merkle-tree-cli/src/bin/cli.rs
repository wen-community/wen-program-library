extern crate merkle_tree;

use clap::{Parser, Subcommand};
use merkle_tree::phase_merkle_tree::PhaseMerkleTree;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Args {
    #[clap(subcommand)]
    pub command: Commands,
}

// Subcommands
#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Create a Merkle tree, given a CSV of recipients
    CreateMerkleTree(CreateMerkleTreeArgs),
}

#[derive(Parser, Debug)]
pub struct CreateMerkleTreeArgs {
    /// CSV path
    #[clap(long, env)]
    pub csv_path: PathBuf,

    /// Merkle tree out path
    #[clap(long, env)]
    pub merkle_tree_path: PathBuf,
}

fn main() {
    let args = Args::parse();

    match &args.command {
        Commands::CreateMerkleTree(merkle_tree_args) => {
            process_create_merkle_tree(merkle_tree_args);
        }
    }
}

fn process_create_merkle_tree(merkle_tree_args: &CreateMerkleTreeArgs) {
    println!(
        "Creating merkle tree from csv: {}",
        merkle_tree_args.csv_path.display()
    );
    let merkle_tree = PhaseMerkleTree::new_from_csv(&merkle_tree_args.csv_path).unwrap();

    println!(
        "Merkle tree created with root: {:?}",
        merkle_tree.merkle_root
    );
    merkle_tree.write_to_file(&merkle_tree_args.merkle_tree_path);
}
