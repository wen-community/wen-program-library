use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::spl_token_2022::{
        extension::{transfer_hook::TransferHook, BaseStateWithExtensions, StateWithExtensions},
        state::Mint as BaseStateMint,
    },
    token_interface::spl_token_metadata_interface::state::TokenMetadata,
};

/// Attempts to get the additional metadata from a mint account that
/// is supposed to have been initialized with the TokenMetadata extension.
///
/// ### Arguments
///
/// * `mint_account` - The mint account to get the metadata from.
///
/// ### Errors
///
/// * If the mint account data is not initialized with the TokenMetadata extension or
/// if the data is not serialized correctly.
///
/// ### Returns
///
/// A vector of tuples containing the key and value of the additional metadata.
pub fn get_metadata(mint_account: &AccountInfo) -> Result<Vec<(String, String)>> {
    let mint_account_data = mint_account.try_borrow_data()?;
    let mint_data: StateWithExtensions<_> =
        StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;
    Ok(metadata.additional_metadata)
}

/// Attempts to get the transfer hook data from a mint account that
/// is supposed to have been initialized with the TransferHook extension.
/// 
/// ### Arguments
/// 
/// * `mint_account` - The mint account to get the transfer hook data from.
/// 
/// ### Errors
/// 
/// * If the mint account data is not initialized with the TransferHook extension or
/// if the data is not serialized correctly.
/// 
/// ### Returns
/// 
/// The transfer hook data.
pub fn get_transfer_hook_data(mint_account: &AccountInfo) -> Result<TransferHook> {
    let mint_account_data = mint_account.try_borrow_data()?;
    let mint_data: StateWithExtensions<_> =
        StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
    let transfer_hook_data = mint_data.get_extension::<TransferHook>()?;
    Ok(transfer_hook_data.to_owned())
}
