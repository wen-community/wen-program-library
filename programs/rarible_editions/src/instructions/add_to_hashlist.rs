use anchor_lang::prelude::*;
use anchor_lang::{accounts::{unchecked_account::UncheckedAccount, signer::Signer, program::Program}, system_program::System};
use solana_program::program::invoke;
use solana_program::pubkey::Pubkey;
use solana_program::system_instruction;

pub fn add_to_hashlist<'a>(
    new_number_of_mints: u32, 
    hashlist: &mut UncheckedAccount<'a>, 
    payer: &Signer<'a>, 
    system_program: &Program<'a, System>, 
    mint: &Pubkey, 
    deployment: &Pubkey,
    order_number: u64
) -> Result<()> {
    let new_size = 8 + 32 + 4 + (new_number_of_mints) * (32 + 8);
    let rent = Rent::get()?;
    let new_minimum_balance = rent.minimum_balance(new_size as usize);
    let lamports_diff = new_minimum_balance.saturating_sub(hashlist.lamports());
    if lamports_diff > 0 {
        invoke(
            &system_instruction::transfer(&payer.key(), hashlist.key, lamports_diff),
            &[
                payer.to_account_info(),
                hashlist.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
    }
    hashlist.realloc(new_size as usize, false)?;
    let hashlist_account_info = hashlist.to_account_info();

    let mut hashlist_data = hashlist_account_info.data.borrow_mut();

    hashlist_data[40..44].copy_from_slice(&new_number_of_mints.to_le_bytes());
    let mint_start_pos:usize = (44+(new_number_of_mints-1)*40) as usize;
    hashlist_data[
        mint_start_pos..(mint_start_pos+32)
        ].copy_from_slice(mint.key().as_ref());
    hashlist_data[
        mint_start_pos + 32..mint_start_pos + 40
        ].copy_from_slice(&order_number.to_le_bytes());

    emit!(HashlistEvent {
        mint: mint.key(),
        deployment: deployment.key()
    });
    
    Ok(())
}
