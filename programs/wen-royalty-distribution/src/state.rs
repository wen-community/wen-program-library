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
