use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::DistributionAccount;

#[derive(Accounts)]
#[instruction(payment_mint: Pubkey)]
pub struct InitializeDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mint::token_program = anchor_spl::token_interface::spl_token_2022::id()
    )]
    /// CHECK: group account, can be any account
    pub group_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        seeds = [group_mint.key().as_ref(), payment_mint.as_ref()],
        bump,
        payer = payer,
        space =  8 + DistributionAccount::INIT_SPACE
    )]
    pub distribution_account: Box<Account<'info, DistributionAccount>>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeDistribution>, payment_mint: Pubkey) -> Result<()> {
    ctx.accounts
        .distribution_account
        .initialize_account_data(ctx.accounts.group_mint.key(), payment_mint);
    Ok(())
}
