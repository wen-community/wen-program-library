use anchor_lang::solana_program::pubkey::Pubkey;

use crate::Creator;

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
