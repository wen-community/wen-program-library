use anchor_lang::{
    prelude::Result,
    solana_program::{
        account_info::AccountInfo, program::invoke, rent::Rent, system_instruction::transfer,
        sysvar::Sysvar,
    },
    Lamports,
};

/// Accounts needed to update an account to have the minimum balance
/// required to be rent exempt.
pub struct UpdateAccountLamportsToMinimumBalanceAccountInfos<'info> {
    /// CHECK: Source account to update.
    pub account: AccountInfo<'info>,
    /// CHECK: Account to transfer lamports from.
    pub payer: AccountInfo<'info>,
    /// CHECK: System program account.
    pub system_program: AccountInfo<'info>,
}

/// Checks if an account has enough lamports to be rent exempt, and if not,
/// transfers enough lamports from the payer to the account to make it rent
/// exempt.
///
/// ### Arguments
///
/// * `account_infos` - Accounts needed to update an account to have the minimum
/// balance required to be rent exempt.
///
/// ### Errors
///
/// * If the account is not rent exempt and the payer does not have enough
///  lamports to make the account rent exempt.
pub fn update_account_lamports_to_minimum_balance<'info>(
    UpdateAccountLamportsToMinimumBalanceAccountInfos {
        account,
        payer,
        system_program,
    }: UpdateAccountLamportsToMinimumBalanceAccountInfos<'info>,
) -> Result<()> {
    let extra_lamports = Rent::get()?.minimum_balance(account.data_len()) - account.get_lamports();
    if extra_lamports > 0 {
        invoke(
            &transfer(payer.key, account.key, extra_lamports),
            &[payer, account, system_program],
        )?;
    }
    Ok(())
}
