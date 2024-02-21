use anchor_lang::prelude::*;

#[error_code]
pub enum DistributionErrors {
    #[msg("Invalid Group Authority for collection account")]
    InvalidGroupAuthority,
    #[msg("Invalid distribution account for mint")]
    IncorrectDistributionAccount,
    #[msg("Invalid creator pct amount. Must add up to 100")]
    InvalidCreatorPctAmount,
}
