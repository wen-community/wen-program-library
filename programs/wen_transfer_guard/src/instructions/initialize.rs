use anchor_lang::{
    prelude::*,
    solana_program::sysvar::{self},
};
use anchor_spl::{token_2022::spl_token_2022::ID as TOKEN_2022_PROGRAM_ID, token_interface::Mint};
use spl_tlv_account_resolution::{account::ExtraAccountMeta, state::ExtraAccountMetaList};
use spl_transfer_hook_interface::{error::TransferHookError, instruction::ExecuteInstruction};

use crate::{AnchorExtraAccountMeta, GuardV1, EXTRA_ACCOUNT_METAS, GUARD_V1, WEN_TOKEN_GUARD};

#[derive(Accounts)]
#[instruction(metas: Vec<AnchorExtraAccountMeta>)]
pub struct Initialize<'info> {
    /// CHECK: This account's data is a buffer of TLV data
    #[account(
        init,
        space = ExtraAccountMetaList::size_of(2).unwrap(),
        // space = 8 + 4 + 2 * 35,
        seeds = [EXTRA_ACCOUNT_METAS.as_ref(), mint.key().as_ref()],
        bump,
        payer = payer,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,

    #[account(
        seeds = [
            WEN_TOKEN_GUARD.as_ref(),
            GUARD_V1.as_ref(),
            guard.identifier.as_ref()
        ],
        bump = guard.bump,
    )]
    pub guard: Account<'info, GuardV1>,

    #[account(mint::token_program = TOKEN_2022_PROGRAM_ID)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    // TODO: SWAP FOR ALTERNATIVE (READ METADATA AUTHORITY FROM TLV DATA[?])
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn processor(ctx: Context<Initialize>) -> Result<()> {
    let extra_metas_account = &ctx.accounts.extra_metas_account;
    let mint = &ctx.accounts.mint;
    let mint_authority = &ctx.accounts.mint_authority;
    let guard = &ctx.accounts.guard;

    if mint_authority.key()
        != mint.mint_authority.ok_or(Into::<ProgramError>::into(
            TransferHookError::MintHasNoMintAuthority,
        ))?
    {
        Err(Into::<ProgramError>::into(
            TransferHookError::IncorrectMintAuthority,
        ))?;
    }

    let metas: Vec<ExtraAccountMeta> = vec![
        // Guard to be assigned to
        ExtraAccountMeta {
            discriminator: 1, // 1 As in PDA for current program.
            is_signer: false.into(),
            is_writable: false.into(),
            address_config: guard.key().to_bytes(),
        },
        // Instructions sysvar to check for caller program
        ExtraAccountMeta {
            discriminator: 0, // 0 As in static pubkey (Sysvar).
            is_signer: false.into(),
            is_writable: false.into(),
            address_config: sysvar::instructions::id().to_bytes(),
        },
    ];

    let mut data = extra_metas_account.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &metas)?;

    Ok(())
}
