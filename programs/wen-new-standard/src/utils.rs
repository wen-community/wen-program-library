use anchor_lang::{
    prelude::Result,
    solana_program::{
        account_info::AccountInfo, program::invoke, pubkey::Pubkey, rent::Rent,
        system_instruction::transfer, sysvar::Sysvar,
    },
    Lamports,
};
use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::{BaseStateWithExtensions, Extension, StateWithExtensions},
        solana_zk_token_sdk::zk_token_proof_instruction::Pod,
        state::Mint,
    },
    spl_token_metadata_interface::state::TokenMetadata,
};

use crate::{APPROVE_ACCOUNT_SEED, META_LIST_ACCOUNT_SEED};

pub fn update_mint_lamports_to_minimum_balance<'info>(
    mint: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
) -> Result<()> {
    let extra_lamports = Rent::get()?.minimum_balance(mint.data_len()) - mint.get_lamports();
    if extra_lamports > 0 {
        invoke(
            &transfer(payer.key, mint.key, extra_lamports),
            &[payer, mint, system_program],
        )?;
    }
    Ok(())
}

pub fn get_mint_metadata(account: &mut AccountInfo) -> Result<TokenMetadata> {
    let mint_data = account.data.borrow();
    let mint_with_extension = StateWithExtensions::<Mint>::unpack(&mint_data)?;
    let extension_data = mint_with_extension.get_variable_len_extension::<TokenMetadata>()?;
    Ok(extension_data)
}

pub fn get_extension_data<T: Extension + Pod>(account: &mut AccountInfo) -> Result<T> {
    let mint_data = account.data.borrow();
    let mint_with_extension = StateWithExtensions::<Mint>::unpack(&mint_data)?;
    let extension_data = *mint_with_extension.get_extension::<T>()?;
    Ok(extension_data)
}

pub fn get_extra_meta_list_account_pda(mint: Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[META_LIST_ACCOUNT_SEED, mint.as_ref()], &crate::id()).0
}

pub fn get_approve_account_pda(mint: Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[APPROVE_ACCOUNT_SEED, mint.as_ref()], &crate::id()).0
}
