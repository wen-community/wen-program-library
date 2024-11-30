use anchor_lang::prelude::*;

#[error_code]
pub enum EditionsControlsError {
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

    #[msg("Platform fee calculation failed.")]
    FeeCalculationError,

    #[msg("Total fee exceeds the price amount.")]
    FeeExceedsPrice,

    #[msg("Total fee shares must equal 100.")]
    InvalidFeeShares,

    #[msg("Too many platform fee recipients. Maximum allowed is 5.")]
    TooManyRecipients,

    #[msg("Recipient account does not match the expected address.")]
    RecipientMismatch,

    #[msg("No phases have been added. Cannot mint.")]
    NoPhasesAdded,

    #[msg("Invalid phase index.")]
    InvalidPhaseIndex,

    #[msg("Private phase but no merkle proof provided")]
    PrivatePhaseNoProof,

    #[msg("Merkle root not set for allow list mint")]
    MerkleRootNotSet,

    #[msg("Merkle proof required for allow list mint")]
    MerkleProofRequired,

    #[msg("Allow list price and max claims are required for allow list mint")]
    AllowListPriceAndMaxClaimsRequired,

    #[msg("Invalid merkle proof")]
    InvalidMerkleProof,

    #[msg("This wallet has exceeded allow list max_claims in the current phase")]
    ExceededAllowListMaxClaims,

    #[msg("Phase not active")]
    PhaseNotActive,

    #[msg("Phase not yet started")]
    PhaseNotStarted,

    #[msg("Phase already finished")]
    PhaseAlreadyFinished,

    #[msg("Exceeded max mints for this phase")]
    ExceededMaxMintsForPhase,

    #[msg("Exceeded wallet max mints for this phase")]
    ExceededWalletMaxMintsForPhase,

    #[msg("Exceeded wallet max mints for the collection")]
    ExceededWalletMaxMintsForCollection,
}
