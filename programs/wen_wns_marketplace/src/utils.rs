use crate::errors::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{
        create as create_associated_token, get_associated_token_address_with_program_id,
        Create as CreateAssociatedToken,
    },
    token_2022::{self, spl_token_2022::instruction::transfer_checked},
};
use spl_transfer_hook_interface::onchain::add_extra_accounts_for_execute_cpi;

pub fn assert_right_associated_token_account(
    owner: &Pubkey,
    mint: &Pubkey,
    associated_token_account: &Pubkey,
) -> Result<()> {
    let expected_associated_token_account =
        get_associated_token_address_with_program_id(owner, mint, &token_2022::ID);

    require_eq!(
        associated_token_account,
        &expected_associated_token_account,
        WenWnsMarketplaceError::InvalidPaymentTokenAccount
    );

    Ok(())
}

pub fn create_associated_token_account<'info>(
    payer: AccountInfo<'info>,
    owner: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    associated_token_account: AccountInfo<'info>,
    associated_token_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
) -> Result<()> {
    assert_right_associated_token_account(owner.key, mint.key, associated_token_account.key)?;

    create_associated_token(CpiContext::new(
        associated_token_program,
        CreateAssociatedToken {
            payer,
            authority: owner,
            mint,
            associated_token: associated_token_account,
            system_program,
            token_program,
        },
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct TransferCheckedWithHook<'info> {
    /// CHECK: CPI Accounts
    pub from: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub mint: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub to: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub authority: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub wns_program: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub extra_metas_account: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub approve_account: AccountInfo<'info>,
}

pub fn transfer_checked_with_hook<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, TransferCheckedWithHook<'info>>,
    amount: u64,
    decimals: u8,
) -> Result<()> {
    let mut ix = transfer_checked(
        ctx.program.key,
        ctx.accounts.from.key,
        ctx.accounts.mint.key,
        ctx.accounts.to.key,
        ctx.accounts.authority.key,
        &[],
        amount,
        decimals,
    )?;

    let mut account_infos = vec![
        ctx.accounts.from.clone(),
        ctx.accounts.mint.clone(),
        ctx.accounts.to.clone(),
        ctx.accounts.authority.clone(),
    ];

    let additional_account_infos = vec![
        ctx.accounts.approve_account.to_account_info(),
        ctx.accounts.wns_program.to_account_info(),
        ctx.accounts.extra_metas_account.to_account_info(),
    ];

    add_extra_accounts_for_execute_cpi(
        &mut ix,
        &mut account_infos,
        &ctx.accounts.wns_program.key(),
        ctx.accounts.from,
        ctx.accounts.mint,
        ctx.accounts.to,
        ctx.accounts.authority,
        amount,
        &additional_account_infos,
    )?;

    anchor_lang::solana_program::program::invoke_signed(&ix, &account_infos, ctx.signer_seeds)
        .map_err(Into::into)
}

#[derive(Accounts)]
pub struct TransferCheckedWithTransferGuard<'info> {
    /// CHECK: CPI Accounts
    pub from: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub mint: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub to: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub authority: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub wen_transfer_guard_program: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub extra_metas_account: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub guard_account: AccountInfo<'info>,
    /// CHECK: CPI Accounts
    pub sysvar_instructions: AccountInfo<'info>,
}

pub fn transfer_checked_with_transfer_guard<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, TransferCheckedWithTransferGuard<'info>>,
    amount: u64,
    decimals: u8,
) -> Result<()> {
    let mut ix = transfer_checked(
        ctx.program.key,
        ctx.accounts.from.key,
        ctx.accounts.mint.key,
        ctx.accounts.to.key,
        ctx.accounts.authority.key,
        &[],
        amount,
        decimals,
    )?;

    let mut account_infos = vec![
        ctx.accounts.from.clone(),
        ctx.accounts.mint.clone(),
        ctx.accounts.to.clone(),
        ctx.accounts.authority.clone(),
    ];

    let additional_account_infos = vec![
        ctx.accounts.guard_account.to_account_info(),
        ctx.accounts.sysvar_instructions.to_account_info(),
        ctx.accounts.wen_transfer_guard_program.to_account_info(),
        ctx.accounts.extra_metas_account.to_account_info(),
    ];

    add_extra_accounts_for_execute_cpi(
        &mut ix,
        &mut account_infos,
        &ctx.accounts.wen_transfer_guard_program.key(),
        ctx.accounts.from,
        ctx.accounts.mint,
        ctx.accounts.to,
        ctx.accounts.authority,
        amount,
        &additional_account_infos,
    )?;

    anchor_lang::solana_program::program::invoke_signed(&ix, &account_infos, ctx.signer_seeds)
        .map_err(Into::into)
}
