use anchor_lang::prelude::*;
use serde::Serialize;

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace, Debug, Serialize)]
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
    #[max_len(1)] // initial length
    pub claim_data: Vec<Creator>,
}

pub const CLAIM_DATA_OFFSET: usize = 8 + DistributionAccount::INIT_SPACE - Creator::INIT_SPACE;
pub const DISTRIBUTION_ACCOUNT_MIN_LEN: usize = DistributionAccount::INIT_SPACE + 8;

impl DistributionAccount {
    pub const VERSION: u8 = 1;
    pub fn initialize_account_data(&mut self, group_mint: Pubkey, payment_mint: Pubkey) {
        self.version = Self::VERSION;
        self.group_mint = group_mint;
        self.payment_mint = payment_mint;
        self.claim_data = vec![];
    }
}
