use anchor_lang::prelude::*;

#[error_code]
pub enum DistributionErrors {
    #[msg("Invalid creator pct amount. Must add up to 100")]
    InvalidCreatorPctAmount,
}
