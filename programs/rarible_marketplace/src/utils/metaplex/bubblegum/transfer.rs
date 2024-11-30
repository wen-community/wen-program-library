use anchor_lang::prelude::*;
use mpl_bubblegum::instructions::{TransferCpi, TransferCpiAccounts, TransferInstructionArgs};

pub fn compressed_transfer<'a>(
    program: AccountInfo<'a>,
    accounts: TransferCpiAccounts<'a, '_>,
    remaining_accounts: &[(&AccountInfo<'a>, bool, bool)],
    signer_seeds: &[&[&[u8]]],
    args: TransferInstructionArgs,
) -> Result<()> {
    let cpi = TransferCpi::new(&program, accounts, args);
    cpi.invoke_signed_with_remaining_accounts(signer_seeds, remaining_accounts)?;

    Ok(())
}
