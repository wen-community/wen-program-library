use anchor_lang::solana_program::pubkey::Pubkey;

use crate::Creator;

/// search for creator, if found return amount and set claim amount to 0
pub fn get_and_clear_creator_royalty_amount(
    creator_address: Pubkey,
    claim_data: &mut [Creator],
) -> u64 {
    let mut amount = 0;
    for creator in claim_data.iter_mut() {
        if creator.address == creator_address {
            amount = creator.claim_amount;
            creator.claim_amount = 0;
            break;
        }
    }
    amount
}

pub fn get_bump_in_seed_form(bump: &u8) -> [u8; 1] {
    let bump_val = *bump;
    [bump_val]
}
