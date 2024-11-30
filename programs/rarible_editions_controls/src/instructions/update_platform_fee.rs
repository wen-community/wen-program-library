use crate::{EditionsControls, PlatformFeeRecipient, UpdatePlatformFeeArgs};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use rarible_editions::program::RaribleEditions;
use rarible_editions::EditionsDeployment;

#[derive(Accounts)]
#[instruction(input: UpdatePlatformFeeArgs)]
pub struct UpdatePlatformFeeCtx<'info> {
    #[account(mut)]
    pub editions_deployment: Box<Account<'info, EditionsDeployment>>,

    #[account(mut,
        seeds = [b"editions_controls", editions_deployment.key().as_ref()],
        bump
    )]
    pub editions_controls: Box<Account<'info, EditionsControls>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // can be different from payer for PDA integration
    #[account(mut,
        constraint = editions_controls.platform_fee_primary_admin == creator.key() ||
                     editions_controls.platform_fee_secondary_admin == creator.key())]
    pub creator: Signer<'info>,
}

pub fn update_platform_fee(
    ctx: Context<UpdatePlatformFeeCtx>,
    platform_fee_input: UpdatePlatformFeeArgs,
) -> Result<()> {
    let platform_fee_value = platform_fee_input.platform_fee_value;
    let is_fee_flat = platform_fee_input.is_fee_flat;

    let editions_controls = &mut ctx.accounts.editions_controls;

    // Initialize an array of 5 PlatformFeeRecipient with default values
    let mut recipients_array: [PlatformFeeRecipient; 5] = [
        PlatformFeeRecipient {
            address: Pubkey::default(),
            share: 0,
        },
        PlatformFeeRecipient {
            address: Pubkey::default(),
            share: 0,
        },
        PlatformFeeRecipient {
            address: Pubkey::default(),
            share: 0,
        },
        PlatformFeeRecipient {
            address: Pubkey::default(),
            share: 0,
        },
        PlatformFeeRecipient {
            address: Pubkey::default(),
            share: 0,
        },
    ];

    // Populate the array with provided recipients
    for (i, recipient) in platform_fee_input.recipients.iter().enumerate() {
        recipients_array[i] = recipient.clone();
    }
    editions_controls.platform_fee_value = platform_fee_value;
    editions_controls.is_fee_flat = is_fee_flat;
    editions_controls.platform_fee_recipients = recipients_array;

    Ok(())
}
