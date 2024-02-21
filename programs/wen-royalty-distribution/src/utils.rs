use anchor_lang::prelude::*;

use anchor_lang::solana_program::{account_info::AccountInfo, pubkey::Pubkey};
use spl_pod::optional_keys::OptionalNonZeroPubkey;

use crate::{Creator, DistributionErrors};

use anchor_spl::token_interface::spl_token_2022::{
    extension::{BaseStateWithExtensions, Extension, StateWithExtensions},
    solana_zk_token_sdk::zk_token_proof_instruction::Pod,
    state::Mint as BaseStateMint,
};

pub fn get_and_clear_creator_royalty_value(address: Pubkey, data: &mut [Creator]) -> u64 {
    let mut ra = 0;
    for creator in data.iter_mut() {
        if creator.address == address {
            ra = creator.amount;
            creator.amount = 0;
            break;
        }
    }
    ra
}

pub fn get_extension_data<T: Extension + Pod>(account: &mut AccountInfo) -> Result<T> {
    let mint_data = account.data.borrow();
    let mint_with_extension = StateWithExtensions::<BaseStateMint>::unpack(&mint_data)?;
    let extension_data = *mint_with_extension.get_extension::<T>()?;
    Ok(extension_data)
}

pub fn get_pubkey_from_optional_nonzero_pubkey(a: OptionalNonZeroPubkey) -> Result<Pubkey> {
    let pubkey = Option::<Pubkey>::from(a).unwrap();

    if pubkey == Pubkey::default() {
        Err(DistributionErrors::InvalidGroupAuthority.into())
    } else {
        Ok(pubkey)
    }
}
