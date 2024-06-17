use anchor_lang::prelude::*;

#[error_code]
pub enum WenTransferGuardError {
    #[msg("Cpi Rule Enforcement Failed")]
    CpiRuleEnforcementFailed,
    #[msg("Transfer Amount Rule Enforce Failed")]
    TransferAmountRuleEnforceFailed,
    #[msg("Metadata Field Does Not Exist")]
    MetadataFieldDoesNotExist,
    #[msg("Metadata Field Does Not Pass")]
    MetadataFieldDoesNotPass,
    #[msg("Guard token amount should be at least 1")]
    GuardTokenAmountShouldBeAtLeastOne,
    #[msg("Not owned by token 2022 program")]
    NotOwnedByToken2022Program,
    #[msg("Must be initialized by Transfer Hook Authority")]
    MustBeInitializedByTransferHookAuthority,
    #[msg("Mint's assigned Transfer Hook Program is not this one")]
    MintAssignedTransferHookProgramIsNotThisOne,
}
