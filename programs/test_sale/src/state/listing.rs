use anchor_lang::prelude::*;

#[account]
pub struct Listing {
    pub bump: u8,
    pub sale: Pubkey,
    pub mint: Pubkey,
    pub payment_mint: Pubkey,
    pub seller: Pubkey,
    pub seller_token_account: Pubkey,
    pub listing_amount: u64,
}

impl Listing {
    pub fn size() -> usize {
        8 + // anchor discriminator
        1 + // bump
        32 + // sale
        32 + // mint
        32 + // payment_mint
        32 + // seller
        32 + // seller_token_account
        8 // listing_amount
    }
}
