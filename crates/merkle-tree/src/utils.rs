use crate::{merkle_tree::MerkleTree, phase_tree_node::PhaseTreeNode};

pub fn get_proof(merkle_tree: &MerkleTree, index: usize) -> Vec<[u8; 32]> {
    let mut proof = Vec::new();
    let path = merkle_tree.find_path(index).expect("path to index");
    for branch in path.get_proof_entries() {
        if let Some(hash) = branch.get_left_sibling() {
            proof.push(hash.to_bytes());
        } else if let Some(hash) = branch.get_right_sibling() {
            proof.push(hash.to_bytes());
        } else {
            panic!("expected some hash at each level of the tree");
        }
    }
    proof
}

/// Given a set of tree nodes, get the max total claim amount. Panics on overflow
pub fn get_max_total_claim(nodes: &[PhaseTreeNode]) -> u64 {
    nodes
        .iter()
        .try_fold(0, |acc: u64, n| acc.checked_add(n.max_claims()))
        .unwrap()
}

#[derive(Debug)]
pub struct MerkleValidationError {
    pub msg: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::pubkey::Pubkey;

    // Helper function to create a phase tree node
    fn create_node(claimant: Pubkey, claim_price: u64, max_claims: u64) -> PhaseTreeNode {
        PhaseTreeNode {
            claimant,
            proof: None,
            claim_price,
            max_claims,
        }
    }

    #[test]
    fn test_get_max_total_claim_no_overflow() {
        let nodes = vec![
            create_node(Pubkey::new_unique(), 100, 2),
            create_node(Pubkey::new_unique(), 300, 3),
        ];

        let total = get_max_total_claim(&nodes);
        assert_eq!(total, 5); // 2 + 3
    }

    #[test]
    #[should_panic(expected = "Option::unwrap()` on a `None` value")]
    fn test_get_max_total_claim_overflow() {
        let large_number = u64::MAX;
        let nodes = vec![
            create_node(Pubkey::new_unique(), 100, large_number),
            create_node(Pubkey::new_unique(), 200, 1),
        ];

        let _ = get_max_total_claim(&nodes);
    }
}
