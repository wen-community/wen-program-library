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

    let original_length = distribution_account.data_len();
    let new_length = 8 + DistributionAccount::INIT_SPACE + 1;

    if new_length > original_length {
        // Unclear how we'd end up here, but incase
        let data_difference = new_length - original_length;
        let additional_rent_required = Rent::get()?.minimum_balance(data_difference);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.distribution_account.to_account_info(),
                },
            ),
            additional_rent_required,
        )?;

        distribution_account.realloc(new_length, false)?;
    }

    Ok(())
}
