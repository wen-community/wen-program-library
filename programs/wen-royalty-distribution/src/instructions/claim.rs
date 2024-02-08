use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use anchor_spl::{
    token::{self, Transfer},
    token_interface::Token2022,
};

use crate::{get_and_clear_creator_royalty_value, DistributionAccount};

#[derive(Accounts)]
#[instruction()]
pub struct ClaimDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        seeds = [distribution.collection.as_ref()],
        bump,
    )]
    pub distribution: Account<'info, DistributionAccount>,
    /// CHECK: can be token account or distribution account
    #[account(mut)]
    pub distribution_address: UncheckedAccount<'info>,
    /// CHECK: can be token account or distribution account
    #[account(mut)]
    pub payer_address: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
}

impl ClaimDistribution<'_> {
    pub fn transfer_tokens(&self, amount: u64, signer_seeds: &[&[&[u8]]]) -> ProgramResult {
        let cpi_accounts = Transfer {
            from: self.payer_address.to_account_info(),
            to: self.distribution_address.to_account_info(),
            authority: self.distribution.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<ClaimDistribution>, payment_mint: Pubkey) -> Result<()> {
    let mut creators = ctx.accounts.distribution.data.clone();
    let royalty_amount =
        get_and_clear_creator_royalty_value(ctx.accounts.creator.key(), &mut creators);

    if royalty_amount == 0 {
        return Ok(()); // No royalties to claim
    }

    let signer_seeds = &[ctx.accounts.distribution.collection.as_ref()][..];

    if payment_mint.key() == Pubkey::default() {
        ctx.accounts.distribution.sub_lamports(royalty_amount)?;
        ctx.accounts.creator.add_lamports(royalty_amount)?;
    } else {
        ctx.accounts
            .transfer_tokens(royalty_amount, &[signer_seeds])?;
    }

    // update distribution account
    ctx.accounts.distribution.data = creators;

    Ok(())
}
