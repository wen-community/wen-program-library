use anchor_lang::prelude::*;

#[error_code]
pub enum WenTransferGuardError {
    #[msg("Mismatch In Meta List Size")]
    MismatchInMetaListSize,
    #[msg("Cpi Rule Enforce Failed")]
    CpiRuleEnforceFailed,
    #[msg("Caller program id was not passed as argument")]
    CallerProgramIdNotPassedAsArgument,
    #[msg("Amount was not passed as argument")]
    AmountNotPassedAsArgument,
    #[msg("Transfer Amount Rule Enforce Failed")]
    TransferAmountRuleEnforceFailed,
    #[msg("Metadata Field Does Not Exist")]
    MetadataFieldDoesNotExist,
    #[msg("Metadata Field Does Not Pass")]
    MetadataFieldDoesNotPass
}
