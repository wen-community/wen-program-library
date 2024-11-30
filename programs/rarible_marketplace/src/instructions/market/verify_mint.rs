use anchor_lang::prelude::*;
use anchor_lang::Key;

use crate::state::*;

#[derive(Accounts)]
pub struct VerifyMint<'info> {
    #[account(mut,
        constraint = market.initializer.key() == initializer.key()
    )]
    pub initializer: Signer<'info>,
    #[account()]
    pub market: Box<Account<'info, Market>>,
    #[account()]
    /// CHECK: initializer signing is all thats needed
    pub nft_mint: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        seeds = [
            VERIFICATION_SEED,
            nft_mint.key().as_ref(),
            market.key().as_ref()
        ],
        payer = initializer,
        space = 8 + std::mem::size_of::<MintVerification>(),
        bump
    )]
    pub verification: Box<Account<'info, MintVerification>>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<VerifyMint>) -> Result<()> {
    ctx.accounts.verification.verified = 1;
    Ok(())
}
