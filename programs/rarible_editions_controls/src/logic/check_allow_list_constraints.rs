use crate::{errors::EditionsControlsError, MinterStats, Phase};
use anchor_lang::{accounts::account::Account, prelude::*, solana_program::hash::hashv};
use merkle_tree_verify::verify;

/// We need to discern between leaf and intermediate nodes to prevent trivial second
/// pre-image attacks.
/// https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack
const LEAF_PREFIX: &[u8] = &[0];

pub fn check_allow_list_constraints(
    phase: &Phase,
    minter: &Pubkey,
    minter_stats_phase: &mut Account<MinterStats>,
    merkle_proof: Option<Vec<[u8; 32]>>,
    allow_list_price: Option<u64>,
    allow_list_max_claims: Option<u64>,
) -> Result<()> {
    if let Some(merkle_root) = phase.merkle_root {
        if let Some(proof) = merkle_proof {
            if let (Some(phase_list_price), Some(phase_max_claims)) =
                (allow_list_price, allow_list_max_claims)
            {
                /// 1. check constraints
                /// dev: notice that if phase_max_claims is 0, this constraint is disabled
                if phase_max_claims > 0 && minter_stats_phase.mint_count >= phase_max_claims {
                    return Err(EditionsControlsError::ExceededAllowListMaxClaims.into());
                }

                /// 2. construct leaf
                let leaf = hashv(&[
                    &minter.to_bytes(),
                    &phase_list_price.to_le_bytes(),
                    &phase_max_claims.to_le_bytes(),
                ]);
                let node = hashv(&[LEAF_PREFIX, &leaf.to_bytes()]);

                /// 3. verify proof against merkle root
                if !verify(proof, merkle_root, node.to_bytes()) {
                    return Err(EditionsControlsError::InvalidMerkleProof.into());
                }
            } else {
                return Err(EditionsControlsError::AllowListPriceAndMaxClaimsRequired.into());
            }
        } else {
            return Err(EditionsControlsError::MerkleProofRequired.into());
        }
    } else {
        return Err(EditionsControlsError::MerkleRootNotSet.into());
    }

    Ok(())
}
