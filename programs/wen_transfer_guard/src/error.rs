use anchor_lang::prelude::*;

#[error_code]
pub enum WenTransferGuardError {
    #[msg("Mismatch In Meta List Size")]
    MismatchInMetaListSize,
    #[msg("Cpi Rule Enforce Failed")]
    CpiRuleEnforceFailed,
    #[msg("Transfer Amount Rule Enforce Failed")]
    TransferAmountRuleEnforceFailed,
    #[msg("Metadata Field Does Not Exist")]
    MetadataFieldDoesNotExist,
    #[msg("Metadata Field Does Not Pass")]
    MetadataFieldDoesNotPass,
    #[msg("Guard token amount should be at least 1")]
    GuardTokenAmountShouldBeAtLeastOne
}
