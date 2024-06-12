use anchor_lang::{prelude::*, solana_program::program_pack::Pack};
use anchor_spl::{
    token::{spl_token::state::Mint as TokenMint, ID as token_keg_program_id},
    token_2022::spl_token_2022::{extension::StateWithExtensions, state::Mint as Token2022Mint},
    token_interface::{transfer_checked, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    get_and_clear_creator_royalty_amount, get_bump_in_seed_form, DistributionAccount,
    DistributionErrors,
};

#[derive(Accounts)]
pub struct ClaimDistribution<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        has_one = payment_mint,
        seeds = [distribution.group_mint.as_ref(), payment_mint.key().as_ref()],
        bump,
    )]
    pub distribution: Account<'info, DistributionAccount>,
    /// CHECK: can be Pubkey::default() or mint address
    #[account()]
    pub payment_mint: UncheckedAccount<'info>,
    #[account(
        mut,
        token::authority = distribution,
        token::mint = payment_mint,
        token::token_program = token_program,
    )]
    pub distribution_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        token::authority = creator,
        token::mint = payment_mint,
        token::token_program = token_program,
    )]
    pub creator_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl ClaimDistribution<'_> {
    pub fn transfer_tokens(&self, amount: u64, signer_seeds: &[&[&[u8]]]) -> Result<()> {
        let mint_data = self.payment_mint.try_borrow_data()?;
        let mint_decimals = if self.token_program.key.eq(&token_keg_program_id) {
            TokenMint::unpack(&mint_data)?.decimals
        } else {
            StateWithExtensions::<Token2022Mint>::unpack(&mint_data)?
                .base
                .decimals
        };

        let creator_token_account = self
            .creator_token_account
            .clone()
            .ok_or(DistributionErrors::InvalidPaymentTokenAccount)?;

        let distribution_token_account = self
            .distribution_token_account
            .clone()
            .ok_or(DistributionErrors::InvalidPaymentTokenAccount)?;

        let cpi_accounts = TransferChecked {
            mint: self.payment_mint.to_account_info(),
            from: distribution_token_account.to_account_info(),
            to: creator_token_account.to_account_info(),
            authority: self.distribution.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer_checked(cpi_ctx, amount, mint_decimals)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<ClaimDistribution>) -> Result<()> {
    let mut claim_data = ctx.accounts.distribution.claim_data.clone();
    let payment_mint = &ctx.accounts.payment_mint;

    let claim_amount =
        get_and_clear_creator_royalty_amount(ctx.accounts.creator.key(), &mut claim_data);

    if claim_amount == 0 {
        return Ok(()); // No royalties to claim
    }

    let payment_mint_key = payment_mint.key();

    let signer_seeds = [
        ctx.accounts.distribution.group_mint.as_ref(),
        payment_mint_key.as_ref(),
        &get_bump_in_seed_form(&ctx.bumps.distribution),
    ];

    if payment_mint_key == Pubkey::default() {
        ctx.accounts.distribution.sub_lamports(claim_amount)?;
        ctx.accounts.creator.add_lamports(claim_amount)?;
    } else {
        ctx.accounts
            .transfer_tokens(claim_amount, &[&signer_seeds[..]])?;
    }

    // update distribution account
    ctx.accounts.distribution.claim_data = claim_data;

    Ok(())
}
