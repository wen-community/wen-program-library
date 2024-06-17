use crate::tools::get_transfer_hook_data;
use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::{
    extension::{transfer_hook::TransferHookAccount, BaseStateWithExtensions, StateWithExtensions},
    state::Account as Token2022Account,
};
use spl_transfer_hook_interface::error::TransferHookError;

/// Checks that the input token account in the form of account data
/// has been set as transferring by the Token Program, so this only
/// happens within the context of a transfer performed by the Token Program.
///
/// ### Arguments
///
/// * `account_data` - The account data of the token account to check.
///
/// ### Errors
///
/// * If the token account is not set as transferring.
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

/// Checks if the mint account has been initialized by the transfer hook authority.
///
/// ### Arguments
///
/// * `mint_account` - The mint account info to check.
/// * `transfer_hook_authority` - The alleged transfer hook authority.
///
/// ### Errors
///
/// * If the mint account data is not initialized with the TransferHook extension or
/// if the data is not serialized correctly.
///
/// ### Returns
///
/// A boolean indicating if the mint account has been initialized by the transfer hook authority.
pub fn is_initialized_by_transfer_hook_authority(
    mint_account: &AccountInfo,
    transfer_hook_authority: Pubkey,
) -> Result<bool> {
    let transfer_hook_data = get_transfer_hook_data(mint_account)?;
    let pubkey = transfer_hook_data.authority.0;
    return Ok(pubkey == transfer_hook_authority);
}

/// Checks if the transfer hook data has been initialized and is pointing
/// to the current program.
///
/// ### Arguments
///
/// * `mint_account` - The mint account info to check.
///
/// ### Errors
///
/// * If the mint account data is not initialized with the TransferHook extension or
/// if the data is not serialized correctly.
///
/// ### Returns
///
/// A boolean indicating if the mint account has been initialized by the current program.
pub fn is_mint_transfer_hook_assigned_to_this_program(mint_account: &AccountInfo) -> Result<bool> {
    let transfer_hook_data = get_transfer_hook_data(mint_account)?;
    let pubkey = transfer_hook_data.program_id.0;
    return Ok(pubkey == crate::ID);
}
