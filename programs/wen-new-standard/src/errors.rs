use anchor_lang::prelude::*;

#[error_code]
pub enum MetadataErrors {
    #[msg("Collection size exceeds max size.")]
    SizeExceedsMaxSize,
    #[msg("Max size cannot be reduced below current size.")]
    MaxSizeBelowCurrentSize,
    #[msg("Creators shares must add up to 100.")]
    CreatorShareInvalid,
    #[msg("Missing approve account.")]
    MissingApproveAccount,
    #[msg("Approve account has expired.")]
    ExpiredApproveAccount,
}

#[error_code]
pub enum MintErrors {
    #[msg("Missing permanent delegate account.")]
    MissingPermanentDelegate,
}
