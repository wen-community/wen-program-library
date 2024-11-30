use anchor_lang::prelude::*;

#[error_code]
pub enum EditionsError {
    #[msg("Ticker too long")]
    TickerTooLong,

    #[msg("Mint template too long")]
    MintTemplateTooLong,

    #[msg("Deployment template too long")]
    DeploymentTemplateTooLong,

    #[msg("Root type too long")]
    RootTypeTooLong,

    #[msg("Minted out")]
    MintedOut,

    #[msg("Legacy migrations are minted out")]
    LegacyMigrationsAreMintedOut,

    #[msg("Global tree delegate is missing")]
    MissingGlobalTreeDelegate,

    #[msg("Incorrect mint type")]
    IncorrectMintType,

    #[msg("Invalid Metadata")]
    InvalidMetadata,

    #[msg("Creator fee too high")]
    CreatorFeeTooHigh,
}

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
    #[msg("Platform fee basis points must be less than or equal to 10000.")]
    PlatformFeeBasisPointsInvalid,
    #[msg("Recipient shares must add up to 100.")]
    RecipientShareInvalid,
    #[msg("The provided field is invalid or reserved.")]
    ReservedField,
    #[msg("Invalid number of platform fee recipients. Exactly 5 recipients are required.")]
    InvalidNumberOfRecipients,
}
