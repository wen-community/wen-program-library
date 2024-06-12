use std::str::FromStr;

use anchor_lang::{
    accounts::{interface_account::InterfaceAccount, program::Program},
    prelude::*,
    solana_program::account_info::AccountInfo,
    system_program::System,
};
use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::{BaseStateWithExtensions, StateWithExtensions},
        state::Mint as BaseStateMint,
    },
    spl_token_metadata_interface::state::TokenMetadata,
    Mint, Token2022, TokenAccount,
};
use wen_royalty_distribution::{
    cpi::{accounts::UpdateDistribution, update_distribution},
    program::WenRoyaltyDistribution,
    UpdateDistributionArgs,
};

use crate::{ApproveAccount, APPROVE_ACCOUNT_SEED, ROYALTY_BASIS_POINTS_FIELD};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct ApproveTransfer<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mint::token_program = anchor_spl::token_interface::spl_token_2022::id(),
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        seeds = [APPROVE_ACCOUNT_SEED, mint.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + ApproveAccount::INIT_SPACE,
    )]
    pub approve_account: Account<'info, ApproveAccount>,
    /// CHECK: This account can be any mint or Pubkey::default()
    pub payment_mint: UncheckedAccount<'info>,
    #[account(
        mut,
        token::authority = distribution_account,
        token::mint = payment_mint,
        token::token_program = token_program,
    )]
    pub distribution_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        token::authority = authority,
        token::mint = payment_mint,
        token::token_program = token_program,
    )]
    pub authority_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(mut)]
    /// CHECK: CPI Checks
    pub distribution_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub distribution_program: Program<'info, WenRoyaltyDistribution>,
    pub token_program: Program<'info, Token2022>,
}

impl ApproveTransfer<'_> {
    pub fn distribute_royalties(&self, amount: u64) -> Result<()> {
        let distribution_token_account_info = self
            .distribution_token_account
            .as_ref()
            .map(|d| d.to_account_info());

        let authority_token_account_info = self
            .authority_token_account
            .as_ref()
            .map(|a| a.to_account_info());

        let cpi_accounts = UpdateDistribution {
            authority: self.authority.to_account_info(),
            mint: self.mint.to_account_info(),
            payment_mint: self.payment_mint.to_account_info(),
            distribution_account: self.distribution_account.to_account_info(),
            distribution_token_account: distribution_token_account_info,
            authority_token_account: authority_token_account_info,
            system_program: self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.distribution_program.to_account_info(), cpi_accounts);
        update_distribution(cpi_ctx, UpdateDistributionArgs { amount })
    }
}

pub fn handler(ctx: Context<ApproveTransfer>, amount: u64) -> Result<()> {
    let mint_account = ctx.accounts.mint.to_account_info();
    let mint_account_data = mint_account.try_borrow_data()?;
    let mint_data = StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;

    // Load clock and write slot
    let clock = Clock::get()?;
    ctx.accounts.approve_account.slot = clock.slot;

    // get royalty basis points from metadata Vec(String, String)
    let royalty_basis_points = metadata
        .additional_metadata
        .iter()
        .find(|(key, _)| key == ROYALTY_BASIS_POINTS_FIELD)
        .map(|(_, value)| value)
        .map(|value| u64::from_str(value).unwrap())
        .unwrap_or(0);

    let royalty_amount = (amount * royalty_basis_points) / 10000;

    // transfer royalty amount to distribution pda
    ctx.accounts.distribute_royalties(royalty_amount)?;

    Ok(())
}
