use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct CompressedOrderData {
    pub order_nonce: Pubkey,
    pub mint_id: Pubkey,
    pub price: u64,
    pub root: [u8; 32],
    pub data_hash: [u8; 32],
    pub creator_hash: [u8; 32],
    pub index: u32,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct CompressedFillOrderData {
    pub root: [u8; 32],
    pub data_hash: [u8; 32],
    pub creator_hash: [u8; 32],
    pub index: u32,
}

pub mod buy;
pub mod sell;

pub use buy::*;
pub use sell::*;
