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
    #[max_len(1)] // initial length
    pub claim_data: Vec<Creator>,
}

impl DistributionAccount {
    pub const VERSION: u8 = 1;
    pub fn initialize_account_data(&mut self, group_mint: Pubkey, payment_mint: Pubkey) {
        self.version = Self::VERSION;
        self.group_mint = group_mint;
        self.payment_mint = payment_mint;
        self.claim_data = vec![];
    }

    // pub fn add_to_creator(
    //     &mut self,
    //     creator: Pubkey,
    //     amount: u64
    // ) -> Result<()> {
    //     if self.policies.iter().any(|policy| policy.hash == hash) {
    //         return Err(PolicyEngineErrors::PolicyAlreadyExists.into());
    //     }
    //     self.policies.push(Policy {
    //         hash,
    //         policy_type,
    //         identity_filter,
    //     });
    //     Ok(())
    // }

    // pub fn remove_creator(&mut self, creator_address: Pubkey) -> Result<()> {
    //     if self.claim_data.iter().all(|c: &Creator| c.address != creator_address) {
    //         return Err(DistributionErrors::CreatorNotFound.into());
    //     }
    //     // remove creator
    //     let creator_to_remove_share = self
    //         .claim_data
    //         .iter()
    //         .find(|c| c.address == creator_address)
    //         .unwrap() // safe to unwrap as we checked the policy exists
    //         .claim_amount;
    //     if creator_to_remove_share > 0 {
    //         return Err(DistributionErrors::CreatorNonZero.into());
    //     }
    //     self.claim_data.retain(|c| c.address != creator_address);
    //     Ok(())
    // }
}
