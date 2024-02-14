use anchor_lang::{prelude::*, solana_program::sysvar};
use anchor_spl::token_interface::{Mint, TokenAccount};

use crate::{is_cpi, ApproveAccount, MetadataErrors, META_LIST_ACCOUNT_SEED};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct ExecuteTransferHook<'info> {
    #[account(
        token::mint = mint,
        token::authority = owner_delegate,
        token::token_program = anchor_spl::token_interface::spl_token_2022::id(),
    )]
    pub source_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        token::token_program = anchor_spl::token_interface::spl_token_2022::id(),
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        token::mint = mint,
        token::token_program = anchor_spl::token_interface::spl_token_2022::id(),
    )]
    pub destination_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub owner_delegate: SystemAccount<'info>,
    /// CHECK: meta list account
    #[account(
        seeds = [META_LIST_ACCOUNT_SEED, mint.key().as_ref()],
        bump,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,
    #[account(address = sysvar::instructions::id())]
    /// CHECK: constraint check
    pub instructions_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<ExecuteTransferHook>, _amount: u64) -> Result<()> {
    // if transfer is a cpi, enforce royalties if applicable, else do nothing
    if is_cpi(&ctx.accounts.instructions_program.to_account_info())? {
        if ctx.remaining_accounts.is_empty() {
            return Err(MetadataErrors::MissingApproveAccount.into());
        }
        let approve_account: ApproveAccount = AnchorDeserialize::deserialize(
            &mut &ctx.remaining_accounts[0].try_borrow_mut_data()?[8..],
        )?;
        if approve_account.slot == Clock::get()?.slot {
            Ok(())
        } else {
            Err(MetadataErrors::ExpiredApproveAccount.into())
        }
    } else {
        Ok(())
    }
}
