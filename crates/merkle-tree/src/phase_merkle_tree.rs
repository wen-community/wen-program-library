use std::{
    collections::{HashMap, HashSet},
    fs::File,
    io::{BufReader, Write},
    path::PathBuf,
    result,
};

use merkle_tree_verify::verify;
use serde::{Deserialize, Serialize};
use solana_program::{hash::hashv, pubkey::Pubkey};

use crate::{
    error::{MerkleTreeError, MerkleTreeError::MerkleValidationError},
    merkle_tree::MerkleTree,
    phase_csv_entry::PhaseCsvEntry,
    phase_tree_node::PhaseTreeNode,
    utils::{get_max_total_claim, get_proof},
};

// We need to discern between leaf and intermediate nodes to prevent trivial second
// pre-image attacks.
// https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack
const LEAF_PREFIX: &[u8] = &[0];

/// Merkle Tree which will be used to distribute tokens to claimants.
/// Contains all the information necessary to verify claims against the Merkle Tree.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseMerkleTree {
    /// The merkle root, which is uploaded on-chain
    pub merkle_root: [u8; 32],
    pub max_num_nodes: u64,
    pub max_total_claim: u64,
    pub tree_nodes: Vec<PhaseTreeNode>,
}

pub type Result<T> = result::Result<T, MerkleTreeError>;

impl PhaseMerkleTree {
    pub fn new(tree_nodes: Vec<PhaseTreeNode>) -> Result<Self> {
        // Check for duplicate claimants, which is not allowed
        let mut seen_claimants = HashSet::new();
        for node in &tree_nodes {
            if !seen_claimants.insert(node.claimant) {
                return Err(MerkleTreeError::DuplicateClaimant(node.claimant));
            }
        }

        let hashed_nodes: Vec<[u8; 32]> = tree_nodes
            .iter()
            .map(|claim_info| claim_info.hash().to_bytes())
            .collect();

        let tree = MerkleTree::new(&hashed_nodes[..], true);

        let mut processed_tree_nodes = tree_nodes;
        for (i, tree_node) in processed_tree_nodes.iter_mut().enumerate() {
            tree_node.proof = Some(get_proof(&tree, i));
        }

        let max_total_claim = get_max_total_claim(&processed_tree_nodes);
        let tree = PhaseMerkleTree {
            merkle_root: tree
                .get_root()
                .ok_or(MerkleTreeError::MerkleRootError)?
                .to_bytes(),
            max_num_nodes: processed_tree_nodes.len() as u64,
            max_total_claim,
            tree_nodes: processed_tree_nodes,
        };

        println!(
            "created merkle tree with {} nodes and max total claim of {}",
            tree.max_num_nodes, tree.max_total_claim
        );
        tree.validate()?;
        Ok(tree)
    }

    /// Load a merkle tree from a csv path
    pub fn new_from_csv(path: &PathBuf) -> Result<Self> {
        let csv_entries = PhaseCsvEntry::new_from_file(path)?;
        let tree_nodes: Vec<PhaseTreeNode> =
            csv_entries.into_iter().map(PhaseTreeNode::from).collect();
        let tree = Self::new(tree_nodes)?;
        Ok(tree)
    }

    /// Load a serialized merkle tree from file path
    pub fn new_from_file(path: &PathBuf) -> Result<Self> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let tree: PhaseMerkleTree = serde_json::from_reader(reader)?;

        Ok(tree)
    }

    /// Write a merkle tree to a filepath
    pub fn write_to_file(&self, path: &PathBuf) {
        let serialized = serde_json::to_string_pretty(&self).unwrap();
        let mut file = File::create(path).unwrap();
        file.write_all(serialized.as_bytes()).unwrap();
    }

    pub fn get_node(&self, claimant: &Pubkey) -> PhaseTreeNode {
        for i in self.tree_nodes.iter() {
            if i.claimant == *claimant {
                return i.clone();
            }
        }

        panic!("Claimant not found in tree");
    }

    fn validate(&self) -> Result<()> {
        // The Merkle tree can be at most height 32, implying a max node count of 2^32 - 1
        if self.max_num_nodes > 2u64.pow(32) - 1 {
            return Err(MerkleValidationError(format!(
                "Max num nodes {} is greater than 2^32 - 1",
                self.max_num_nodes
            )));
        }

        // validate that the length is equal to the max_num_nodes
        if self.tree_nodes.len() != self.max_num_nodes as usize {
            return Err(MerkleValidationError(format!(
                "Tree nodes length {} does not match max_num_nodes {}",
                self.tree_nodes.len(),
                self.max_num_nodes
            )));
        }

        // validate that there are no duplicate claimants
        let unique_nodes: HashSet<_> = self.tree_nodes.iter().map(|n| n.claimant).collect();

        if unique_nodes.len() != self.tree_nodes.len() {
            return Err(MerkleValidationError(
                "Duplicate claimants found".to_string(),
            ));
        }

        // validate that sum is equal to max_total_claim
        let sum = get_max_total_claim(&self.tree_nodes);

        if sum != self.max_total_claim {
            return Err(MerkleValidationError(format!(
                "Tree nodes sum {} does not match max_total_claim {}",
                sum, self.max_total_claim
            )));
        }

        if self.verify_proof().is_err() {
            return Err(MerkleValidationError(
                "Merkle root is invalid given nodes".to_string(),
            ));
        }

        Ok(())
    }

    /// verify that the leaves of the merkle tree match the nodes
    pub fn verify_proof(&self) -> Result<()> {
        let root = self.merkle_root;

        // Recreate root given nodes
        let hashed_nodes: Vec<[u8; 32]> = self
            .tree_nodes
            .iter()
            .map(|n| n.hash().to_bytes())
            .collect();
        let mk = MerkleTree::new(&hashed_nodes[..], true);

        assert_eq!(
            mk.get_root()
                .ok_or(MerkleValidationError("invalid merkle proof".to_string()))?
                .to_bytes(),
            root
        );

        // Verify each node against the root
        for (i, _node) in hashed_nodes.iter().enumerate() {
            let node = hashv(&[LEAF_PREFIX, &hashed_nodes[i]]);
            let proof = get_proof(&mk, i);

            if !verify(proof, root, node.to_bytes()) {
                return Err(MerkleValidationError("invalid merkle proof".to_string()));
            }
        }

        Ok(())
    }

    // Converts Merkle Tree to a map for faster key access
    pub fn convert_to_hashmap(&self) -> HashMap<Pubkey, PhaseTreeNode> {
        self.tree_nodes
            .iter()
            .map(|n| (n.claimant, n.clone()))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use solana_program::{pubkey, pubkey::Pubkey};
    use solana_sdk::{
        signature::{EncodableKey, Keypair},
        signer::Signer,
    };

    use super::*;

    pub fn new_test_key() -> Pubkey {
        let kp = Keypair::new();
        let out_path = format!("./test/test_keys/{}.json", kp.pubkey());

        kp.write_to_file(out_path)
            .expect("Failed to write to signer");

        kp.pubkey()
    }

    fn new_test_merkle_tree(num_nodes: u64, path: &PathBuf) {
        let mut tree_nodes = vec![];

        fn rand_claim_price() -> u64 {
            rand::random::<u64>() % 100 * u64::pow(10, 9)
        }

        fn rand_max_claims() -> u64 {
            rand::random::<u64>() % 10 + 1
        }

        for _ in 0..num_nodes {
            tree_nodes.push(PhaseTreeNode {
                claimant: new_test_key(),
                proof: None,
                claim_price: rand_claim_price(),
                max_claims: rand_max_claims(),
            });
        }

        let merkle_tree = PhaseMerkleTree::new(tree_nodes).unwrap();

        merkle_tree.write_to_file(path);
    }

    #[test]
    fn test_verify_new_merkle_tree() {
        let tree_nodes = vec![PhaseTreeNode {
            claimant: Pubkey::default(),
            proof: None,
            claim_price: 1000000000,
            max_claims: 5,
        }];
        let merkle_tree = PhaseMerkleTree::new(tree_nodes).unwrap();
        assert!(merkle_tree.verify_proof().is_ok(), "verify failed");
    }

    #[test]
    fn test_write_merkle_distributor_to_file() {
        let tree_nodes = vec![
            PhaseTreeNode {
                claimant: pubkey!("FLYqJsmJ5AGMxMxK3Qy1rSen4ES2dqqo6h51W3C1tYS"),
                proof: None,
                claim_price: 100 * u64::pow(10, 9),
                max_claims: 2,
            },
            PhaseTreeNode {
                claimant: pubkey!("EDGARWktv3nDxRYjufjdbZmryqGXceaFPoPpbUzdpqED"),
                proof: None,
                claim_price: 100 * u64::pow(10, 9),
                max_claims: 2,
            },
            PhaseTreeNode {
                claimant: pubkey!("EDGARWktv3nDxRYjufjdbZmryqGXceaFPoPpbUzdpqEH"),
                proof: None,
                claim_price: 100 * u64::pow(10, 9),
                max_claims: 2,
            },
        ];

        let merkle_distributor_info = PhaseMerkleTree::new(tree_nodes).unwrap();
        let path = PathBuf::from("test/merkle_tree.json");

        merkle_distributor_info.write_to_file(&path);
        let merkle_distributor_read: PhaseMerkleTree =
            PhaseMerkleTree::new_from_file(&path).unwrap();

        assert_eq!(merkle_distributor_read.tree_nodes.len(), 3);
    }

    #[test]
    fn test_new_test_merkle_tree() {
        new_test_merkle_tree(100, &PathBuf::from("test/merkle_tree_test_csv.json"));
    }

    #[test]
    #[should_panic(expected = "DuplicateClaimant")]
    fn test_new_merkle_tree_duplicate_claimants() {
        let duplicate_pubkey = Pubkey::new_unique();
        let tree_nodes = vec![
            PhaseTreeNode {
                claimant: duplicate_pubkey,
                proof: None,
                claim_price: 1000000000,
                max_claims: 5,
            },
            PhaseTreeNode {
                claimant: duplicate_pubkey,
                proof: None,
                claim_price: 2000000000,
                max_claims: 3,
            },
            PhaseTreeNode {
                claimant: Pubkey::new_unique(),
                proof: None,
                claim_price: 3000000000,
                max_claims: 2,
            },
        ];

        PhaseMerkleTree::new(tree_nodes).unwrap();
    }
}
