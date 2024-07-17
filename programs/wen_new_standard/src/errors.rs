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
    #[msg("Invalid field. You cannot use a public key as a field.")]
    InvalidField,
    #[msg("The Address you provided is invalid. Please provide a valid address.")]
    CreatorAddressInvalid,
    #[msg("Royalty basis points must be less than or equal to 10000.")]
    RoyaltyBasisPointsInvalid,
}

#[error_code]
pub enum MintErrors {
    #[msg("Invalid freeze authority.")]
    InvalidFreezeAuthority,
    #[msg("Invalid delegate authority.")]
    InvalidDelegateAuthority,
    #[msg("Invalid Token group member mint")]
    InvalidTokenGroupMemberMint,
}

#[error_code]
pub enum ExtraAccountMetaListErrors {
    #[msg("Extra Account Meta is initialized already")]
    ExtraAccountMetaAlreadyInitialized,
    #[msg("Invalid extra account meta address")]
    InvalidExtraAccountMeta,
    #[msg("Invalid guard account provided")]
    InvalidGuardAccount,
}
