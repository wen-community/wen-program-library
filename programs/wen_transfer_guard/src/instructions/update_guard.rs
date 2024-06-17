use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::{
    error::WenTransferGuardError, CpiRule, GuardV1, MetadataAdditionalFieldRule,
    TransferAmountRule, GUARD_V1, WEN_TOKEN_GUARD,
};

#[derive(Accounts)]
#[instruction(args: UpdateGuardArgs)]
pub struct UpdateGuard<'info> {
    #[account(
        mut,
        seeds = [WEN_TOKEN_GUARD.as_ref(), GUARD_V1.as_ref(), mint.key().as_ref()],
        bump = guard.bump,
    )]
    pub guard: Account<'info, GuardV1>,

    #[account(
        constraint = guard.mint == mint.key(),
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        associated_token::mint = mint,
        associated_token::authority = guard_authority,
        associated_token::token_program = token_program,
        constraint = token_account.amount == 1 @ WenTransferGuardError::GuardTokenAmountShouldBeAtLeastOne
    )]
    pub token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub guard_authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateGuardArgs {
    pub cpi_rule: Option<CpiRule>,
    pub transfer_amount_rule: Option<TransferAmountRule>,
    pub additional_fields_rule: Vec<MetadataAdditionalFieldRule>,
}

/// IX: update_guard
/// Updates a guard after verifying ownership of the token
pub fn processor(ctx: Context<UpdateGuard>, args: UpdateGuardArgs) -> Result<()> {
    let guard = &mut ctx.accounts.guard;
    guard.update(
        args.cpi_rule,
        args.transfer_amount_rule,
        args.additional_fields_rule,
    );
    Ok(())
}
