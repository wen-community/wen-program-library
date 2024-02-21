use anchor_lang::prelude::*;

use crate::{
    get_extension_data, get_pubkey_from_optional_nonzero_pubkey, DistributionAccount,
    DistributionErrors,
};

use anchor_spl::token_interface::{spl_token_2022::extension::group_pointer::GroupPointer, Mint};

#[derive(Accounts)]
#[instruction()]
pub struct InitializeDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mint::token_program = anchor_spl::token_interface::spl_token_2022::id()
    )]
    /// CHECK: collection account, can be any account
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        seeds = [mint.key().as_ref()],
        bump,
        payer = payer,
        space = DistributionAccount::LEN
    )]
    pub distribution: Box<Account<'info, DistributionAccount>>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeDistribution>) -> Result<()> {
    let mint_account = &mut ctx.accounts.mint.to_account_info();
    let group_pointer = get_extension_data::<GroupPointer>(mint_account)?;

    let authority = get_pubkey_from_optional_nonzero_pubkey(group_pointer.authority).unwrap();

    if authority != ctx.accounts.authority.key() {
        return Err(DistributionErrors::InvalidGroupAuthority.into());
    }

    ctx.accounts.distribution.data = vec![];
    ctx.accounts.distribution.authority = authority;
    ctx.accounts.distribution.collection = ctx.accounts.mint.key();
    Ok(())
}
