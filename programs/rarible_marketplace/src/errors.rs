use anchor_lang::prelude::*;

#[error_code]
pub enum MarketError {
    #[msg("Account passed in incorrectly")]
    WrongAccount,
    #[msg("Order too small")]
    InsufficientOrderSize,
    #[msg("Amount overflow")]
    AmountOverflow,
    #[msg("Amount underflow")]
    AmountUnderflow,
    #[msg("Unsupported NFT Type")]
    UnsupportedNft,
    #[msg("Invalid NFT for Market")]
    InvalidNft,
    #[msg("Invalid Fee Account")]
    InvalidFeeAccount,
}
