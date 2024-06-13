use anchor_lang::prelude::*;

#[error_code]
pub enum DistributionErrors {
    #[msg("Invalid Group Authority for collection account")]
    InvalidGroupAuthority,
    #[msg("Invalid creator pct amount. Must add up to 100")]
    InvalidCreatorPctAmount,
    #[msg("Invalid payment token account")]
    InvalidPaymentTokenAccount,
    #[msg("Invalid payment token program")]
    InvalidPaymentTokenProgram,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
