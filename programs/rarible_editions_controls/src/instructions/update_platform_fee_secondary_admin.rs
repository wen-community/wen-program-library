use crate::{EditionsControls, Phase};
use anchor_lang::prelude::*;
use libreplex_shared::wrapped_sol;
use rarible_editions::program::RaribleEditions;

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct UpdatePlatformFeeSecondaryAdminInput {
    pub new_admin: Pubkey,
}

#[derive(Accounts)]
#[instruction(input: UpdatePlatformFeeSecondaryAdminInput)]
pub struct UpdatePlatformFeeSecondaryAdminCtx<'info> {
    #[account(mut)]
    pub editions_deployment: Box<Account<'info, rarible_editions::EditionsDeployment>>,

    #[account(mut,
        seeds = [b"editions_controls", editions_deployment.key().as_ref()],
        bump
    )]
    pub editions_controls: Box<Account<'info, EditionsControls>>,

    // can be different from payer for PDA integration
    #[account(mut,
        constraint = editions_controls.platform_fee_primary_admin == creator.key() ||
                     editions_controls.platform_fee_secondary_admin == creator.key())]
    pub creator: Signer<'info>,
}

pub fn update_platform_fee_secondary_admin(
    ctx: Context<UpdatePlatformFeeSecondaryAdminCtx>,
    input: UpdatePlatformFeeSecondaryAdminInput,
) -> Result<()> {
    let editions_controls = &mut ctx.accounts.editions_controls;
    editions_controls.platform_fee_secondary_admin = input.new_admin;

    Ok(())
}
