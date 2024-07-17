use anchor_lang::{
    prelude::*,
    solana_program::sysvar::{self},
};
use anchor_spl::{token_2022::spl_token_2022::ID as TOKEN_2022_PROGRAM_ID, token_interface::Mint};
use spl_tlv_account_resolution::{account::ExtraAccountMeta, state::ExtraAccountMetaList};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

use crate::{
    error::WenTransferGuardError,
    tools::{
        is_initialized_by_transfer_hook_authority, is_mint_transfer_hook_assigned_to_this_program,
    },
    GuardV1, EXTRA_ACCOUNT_METAS, GUARD_V1, WEN_TOKEN_GUARD,
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: This account's data is a buffer of TLV data
    #[account(
        init,
        space = ExtraAccountMetaList::size_of(2).unwrap(),
        // space = 8 + 4 + 2 * 35,
        seeds = [EXTRA_ACCOUNT_METAS.as_ref(), mint.key().as_ref()],
        bump,
        payer = payer,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,

    #[account(
        seeds = [WEN_TOKEN_GUARD.as_ref(), GUARD_V1.as_ref(), guard.mint.as_ref()],
        bump = guard.bump,
    )]
    pub guard: Account<'info, GuardV1>,

    #[account(
        mint::token_program = TOKEN_2022_PROGRAM_ID,
        constraint = is_initialized_by_transfer_hook_authority(&mint.to_account_info(), transfer_hook_authority.key())? @ WenTransferGuardError::MustBeInitializedByTransferHookAuthority,
        constraint = is_mint_transfer_hook_assigned_to_this_program(&mint.to_account_info())? @ WenTransferGuardError::MintAssignedTransferHookProgramIsNotThisOne,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account()]
    pub transfer_hook_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

/// IX: Initialize
/// Initializes the ExtraMetasAccount set up with the Guard and System Instruction accounts,
/// assigning the Guard to the current Mint in the process.
pub fn processor(ctx: Context<Initialize>) -> Result<()> {
    let extra_metas_account = &ctx.accounts.extra_metas_account;
    let guard = &ctx.accounts.guard;

    let mut data = extra_metas_account.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<ExecuteInstruction>(
        &mut data,
        &(vec![
            ExtraAccountMeta::new_with_pubkey(&guard.key(), false, false)?,
            ExtraAccountMeta::new_with_pubkey(&sysvar::instructions::id(), false, false)?,
        ]),
    )?;

    Ok(())
}
