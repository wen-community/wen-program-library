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

/// Temporary accounts while waiting for Token2022 mainnet on Group and Member Accounts

/// Data struct for a `TokenGroupMember`
#[account()]
pub struct TokenGroupMember {
    /// The associated mint, used to counter spoofing to be sure that member
    /// belongs to a particular mint
    pub mint: Pubkey,
    /// The pubkey of the `TokenGroup`
    pub group: Pubkey,
    /// The member number
    pub member_number: u32,
}
impl TokenGroupMember {
    pub const LEN: usize = 8 + 32 + 32 + 4;
    /// Creates a new `TokenGroupMember` state
    pub fn new(mint: &Pubkey, group: &Pubkey, member_number: u32) -> Self {
        Self {
            mint: *mint,
            group: *group,
            member_number,
        }
    }
}
