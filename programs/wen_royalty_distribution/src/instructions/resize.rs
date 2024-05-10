use crate::DistributionAccount;
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

#[derive(Accounts)]
pub struct ResizeDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        constraint = !distribution_account.data_is_empty()
    )]
    /// CHECK: Owner check is done, only state account in this program
    pub distribution_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ResizeDistribution>) -> Result<()> {
    let distribution_account = &ctx.accounts.distribution_account;
    require_eq!(distribution_account.owner.key(), crate::id());

    let new_length = 8 + DistributionAccount::INIT_SPACE + 1;
    let rent_required = Rent::get()?.minimum_balance(new_length);

    // Account already resized if data_len == new_length
    if distribution_account.data_len() == new_length {
        return Ok(());
    }

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.distribution_account.to_account_info(),
            },
        ),
        rent_required,
    )?;

    distribution_account.realloc(new_length, false)?;
    Ok(())
}
