use solana_program::pubkey::Pubkey;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MerkleTreeError {
    #[error("Merkle Tree Validation Error: {0}")]
    MerkleValidationError(String),
    #[error("Merkle Root Error")]
    MerkleRootError,
    #[error("io Error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Serde Error: {0}")]
    SerdeError(#[from] serde_json::Error),
    #[error("Duplicate claimant found: {0}")]
    DuplicateClaimant(Pubkey),
}
