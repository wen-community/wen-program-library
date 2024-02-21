use anchor_lang::prelude::*;

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Creator {
    pub address: Pubkey,
    pub amount: u64,
}

#[account()]
pub struct DistributionAccount {
    pub collection: Pubkey,
    pub authority: Pubkey,
    pub data: Vec<Creator>,
}

impl DistributionAccount {
    pub const LEN: usize = 8 + ((32 + 8) * 10); // 10 pairs of creator tuples
}

pub const ROYALTY_BASIS_POINTS_FIELD: &str = "royalty_basis_points";

/// Data struct for a `TokenGroup`
#[account()]
pub struct TokenGroup {
    /// The authority that can sign to update the group
    pub update_authority: Pubkey,
    /// The associated mint, used to counter spoofing to be sure that group
    /// belongs to a particular mint
    pub mint: Pubkey,
    /// The current number of group members
    pub size: u32,
    /// The maximum number of group members
    pub max_size: u32,
}
