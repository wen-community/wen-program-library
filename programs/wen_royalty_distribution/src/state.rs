use anchor_lang::prelude::*;

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace)]
pub struct Creator {
    /// creator address
    pub address: Pubkey,
    /// token amount that creator can claim
    pub claim_amount: u64,
}

pub const ROYALTY_BASIS_POINTS_FIELD: &str = "royalty_basis_points";

#[account()]
#[derive(InitSpace)]
pub struct DistributionAccount {
    /// distribution version
    pub version: u8,
    /// group to which the distribution account belongs to
    pub group_mint: Pubkey,
    /// payment mint for the distribution account
    pub payment_mint: Pubkey,
    #[max_len(10)] // we currently support 10 creators
    pub claim_data: Vec<Creator>,
    /// PDA bump
    pub bump: u8,
}

impl DistributionAccount {
    pub const VERSION: u8 = 1;
    pub fn new(&mut self, group_mint: Pubkey, payment_mint: Pubkey) {
        self.version = Self::VERSION;
        self.group_mint = group_mint;
        self.payment_mint = payment_mint;
        self.claim_data = vec![];
    }
}
