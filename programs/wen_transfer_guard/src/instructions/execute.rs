use anchor_lang::{
    prelude::*,
    solana_program::sysvar::{self, instructions::get_instruction_relative},
};
use anchor_spl::{
    token_2022::spl_token_2022::ID as TOKEN_2022_PROGRAM_ID,
    token_interface::{Mint, TokenAccount},
};
use spl_tlv_account_resolution::state::ExtraAccountMetaList;
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

use crate::{
    tools::{check_token_account_is_transferring, get_metadata},
    GuardV1, EXTRA_ACCOUNT_METAS, GUARD_V1, WEN_TOKEN_GUARD,
};

#[derive(Accounts)]
pub struct Execute<'info> {
    #[account(
        token::mint = mint,
        // token::authority = owner_delegate,
        token::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub source_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mint::token_program = TOKEN_2022_PROGRAM_ID)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        token::mint = mint,
        token::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub destination_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: can be any type of account, checked with a constraint above
    pub owner_delegate: UncheckedAccount<'info>,

    /// CHECK: This account's data is a buffer of TLV data
    #[account(
        seeds = [EXTRA_ACCOUNT_METAS.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,

    #[account(
        seeds = [WEN_TOKEN_GUARD.as_ref(), GUARD_V1.as_ref(), guard.mint.as_ref()],
        bump = guard.bump,
    )]
    pub guard: Account<'info, GuardV1>,

    /// CHECK: sysvar account for instruction data
    #[account(address = sysvar::instructions::id())]
    instruction_sysvar_account: UncheckedAccount<'info>,
}

pub fn processor(ctx: Context<Execute>, amount: u64) -> Result<()> {
    let source_account = &ctx.accounts.source_account;
    let destination_account = &ctx.accounts.destination_account;
    let mint_account = &ctx.accounts.mint;
    let guard = &ctx.accounts.guard;

    check_token_account_is_transferring(&source_account.to_account_info().try_borrow_data()?)?;
    check_token_account_is_transferring(&destination_account.to_account_info().try_borrow_data()?)?;

    ExtraAccountMetaList::check_account_infos::<ExecuteInstruction>(
        &ctx.accounts.to_account_infos(),
        &TransferHookInstruction::Execute { amount }.pack(),
        &ctx.program_id,
        &ctx.accounts.extra_metas_account.try_borrow_data()?,
    )?;

    let metadata = get_metadata(&mint_account.to_account_info()).unwrap_or_else(|_| vec![]);

    // Note:
    // In CPI, if program A calls program B and then program B calls this program,
    // the the resulting program id from current_ix will be program A.
    let caller_program_id = &get_instruction_relative(
        0,
        &ctx.accounts.instruction_sysvar_account.to_account_info(),
    )?
    .program_id;

    // Enforce guard rules
    guard.enforce_rules(&metadata, amount, caller_program_id.key())?;

    Ok(())
}
