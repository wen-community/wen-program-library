use anchor_lang::prelude::*;

#[account]
pub struct Sale {
    pub bump: u8,
    pub group: Pubkey,
    pub distribution: Pubkey,
    pub authority: Pubkey,
}

impl Sale {
    pub fn size() -> usize {
        8 + // anchor discriminator
        1 + // bump
        32 + // group
        32 + // distribution
        32 // authority
    }
}
