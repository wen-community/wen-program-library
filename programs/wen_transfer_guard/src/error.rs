use anchor_lang::prelude::*;

#[error_code]
pub enum WenTransferGuardError {
    #[msg("Mismatch In Meta List Size")]
    MismatchInMetaListSize,
}
