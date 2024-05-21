use anchor_lang::prelude::*;

use crate::{
    CpiRule, GuardV1, MetadataAdditionalFieldRule, TransferAmountRule, GUARD_V1, WEN_TOKEN_GUARD,
};

#[derive(Accounts)]
#[instruction(
    // 32 Bytes identifier, can be a hash, a string, etc.
    identifier: [u8; 32],
    cpi_rule: Option<CpiRule>,
    transfer_amount_rule: Option<TransferAmountRule>,
    addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
)]
pub struct CreateGuard<'info> {
    #[account(
        init,
        seeds = [
            WEN_TOKEN_GUARD.as_ref(),
            GUARD_V1.as_ref(),
            identifier.as_ref()
        ],
        bump,
        payer = payer,
        space = GuardV1::size_of(cpi_rule, transfer_amount_rule, addition_fields_rule),
    )]
    pub guard: Account<'info, GuardV1>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn processor(
    ctx: Context<CreateGuard>,
    identifier: [u8; 32],
    cpi_rule: Option<CpiRule>,
    transfer_amount_rule: Option<TransferAmountRule>,
    addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
) -> Result<()> {
    let guard = &mut ctx.accounts.guard;
    let bump = ctx.bumps.guard;

    guard.set_inner(GuardV1::new(
        identifier,
        bump,
        cpi_rule,
        transfer_amount_rule,
        addition_fields_rule,
    ));
    Ok(())
}
