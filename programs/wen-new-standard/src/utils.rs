use anchor_lang::{
    prelude::Result,
    solana_program::{
        account_info::AccountInfo, program::invoke, rent::Rent, system_instruction::transfer,
        sysvar::Sysvar,
    },
    Lamports,
};

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
