use std::str::FromStr;

use serde::{Deserialize, Serialize};
use solana_program::{hash::hashv, pubkey::Pubkey};
use solana_sdk::hash::Hash;

use crate::phase_csv_entry::PhaseCsvEntry;

/// Represents the claim information for an account in a phase.
#[derive(Debug, Clone, Eq, Hash, PartialEq, Serialize, Deserialize)]
pub struct PhaseTreeNode {
    /// Pubkey of the claimant; will be responsible for signing the claim
    pub claimant: Pubkey,
    /// Price to claim for this address
    pub claim_price: u64,
    /// Maximum number of claims allowed for this address
    pub max_claims: u64,
    /// Claimant's proof of inclusion in the Merkle Tree
    pub proof: Option<Vec<[u8; 32]>>,
}

impl PhaseTreeNode {
    pub fn hash(&self) -> Hash {
        hashv(&[
            &self.claimant.to_bytes(),
            &self.claim_price.to_le_bytes(),
            &self.max_claims.to_le_bytes(),
        ])
    }

    /// Get the claim price for this phase for this claimant
    pub fn claim_price(&self) -> u64 {
        self.claim_price
    }

    /// Get the maximum number of claims allowed for this phase for this claimant
    pub fn max_claims(&self) -> u64 {
        self.max_claims
    }
}

impl From<PhaseCsvEntry> for PhaseTreeNode {
    fn from(entry: PhaseCsvEntry) -> Self {
        Self {
            claimant: Pubkey::from_str(&entry.address).unwrap(),
            proof: None,
            claim_price: entry.price,
            max_claims: entry.max_claims,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialize_phase_tree_node() {
        let phase_tree_node = PhaseTreeNode {
            claimant: Pubkey::default(),
            claim_price: 1000000000,
            max_claims: 5,
            proof: None,
        };
        let serialized = serde_json::to_string(&phase_tree_node).unwrap();
        let deserialized: PhaseTreeNode = serde_json::from_str(&serialized).unwrap();
        assert_eq!(phase_tree_node, deserialized);
    }
}
