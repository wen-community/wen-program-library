use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::spl_token_2022::ID as TOKEN_2022_PROGRAM_ID,
    token_interface::{Mint, TokenAccount},
};
use spl_tlv_account_resolution::state::ExtraAccountMetaList;
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

use crate::{tools::check_token_account_is_transferring, EXTRA_ACCOUNT_METAS};

#[derive(Accounts)]
pub struct Execute<'info> {
    #[account(
        token::mint = mint,
        token::authority = owner_delegate,
        token::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub source_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mint::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        token::mint = mint,
        token::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub destination_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub owner_delegate: SystemAccount<'info>,

    /// CHECK: This account's data is a buffer of TLV data
    #[account(
        seeds = [EXTRA_ACCOUNT_METAS.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,

    /// CHECK: TODO: ADD VALIDATION FOR DENYLIST/ALLOWLIST ACCOUNTS
    pub denylist: UncheckedAccount<'info>,
}

pub fn processor(ctx: Context<Execute>, amount: u64) -> Result<()> {
    let source_account = &ctx.accounts.source_account;
    let destination_account = &ctx.accounts.destination_account;

    check_token_account_is_transferring(&source_account.to_account_info().try_borrow_data()?)?;
    check_token_account_is_transferring(&destination_account.to_account_info().try_borrow_data()?)?;

    let data = ctx.accounts.extra_metas_account.try_borrow_data()?;
    ExtraAccountMetaList::check_account_infos::<ExecuteInstruction>(
        &ctx.accounts.to_account_infos(),
        &TransferHookInstruction::Execute { amount }.pack(),
        &ctx.program_id,
        &data,
    )?;

    Ok(())
}
