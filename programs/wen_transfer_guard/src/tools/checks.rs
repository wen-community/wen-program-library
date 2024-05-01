use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::{
    extension::{transfer_hook::TransferHookAccount, BaseStateWithExtensions, StateWithExtensions},
    state::Account as Token2022Account,
};
use spl_transfer_hook_interface::error::TransferHookError;

pub fn check_token_account_is_transferring(account_data: &[u8]) -> Result<()> {
    let token_account = StateWithExtensions::<Token2022Account>::unpack(account_data)?;
    let extension = token_account.get_extension::<TransferHookAccount>()?;
    if bool::from(extension.transferring) {
        Ok(())
    } else {
        Err(Into::<ProgramError>::into(
            TransferHookError::ProgramCalledOutsideOfTransfer,
        ))?
    }
}
