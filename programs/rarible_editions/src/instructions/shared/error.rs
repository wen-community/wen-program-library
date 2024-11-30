use anchor_lang::prelude::*;

#[error_code]
pub enum SharedError {
    // 6000
    #[msg("Numeric overflow")]
    NumericalOverflow,

    // 6001
    #[msg("Derived key invalid")]
    DerivedKeyInvalid,

    // 6002
    #[msg("Missing bump")]
    MissingBump,

    // 6003
    #[msg("Invalid bump")]
    InvalidBump,

    // 6004
    #[msg("Missing master edition for NFT")]
    MissingMasterEditionForNft,

    // 6005
    #[msg("Token account not empty")]
    TokenAccountNotEmpty,

    // 6006
    #[msg("Missing token account")]
    MissingTokenAccount,

    // 6006
    #[msg("Missing destination account")]
    MissingDestinationAccount,

    #[msg("Bad treasury")]
    BadTreasury,

    #[msg("Bad owner")]
    BadOwner,

    #[msg("Bad mint")]
    BadMint,

    #[msg("Bad mint on token account")]
    BadTokenAccountMint,

    #[msg("Bad owner of token account")]
    BadTokenAccountOwner,

    #[msg("Bad token account")]
    BadTokenAccount,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    #[msg("Instruction build error")]
    InstructionBuildError,

    #[msg("Unexpected token type")]
    UnexpectedTokenType,

    #[msg("When transferring a pNFT, the amount must be 1")]
    CannotTransferMultiplePnfts,

    #[msg("Must transfer auth seeds for native sol")]
    NativeSolAuthSeedsNotSpecified,

    #[msg("Missing token record")]
    MissingTokenRecord,

    #[msg("Instruction builder failed")]
    InstructionBuilderFailed,

    #[msg("Spl conversion not allowed")]
    SplConversionNotAllowed,

    #[msg("This deployment requires the creator to co-sign")]
    InvalidCreatorCosigner,
}
