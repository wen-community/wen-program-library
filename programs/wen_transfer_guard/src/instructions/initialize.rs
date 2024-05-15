use anchor_lang::prelude::*;
use anchor_spl::{token_2022::spl_token_2022::ID as TOKEN_2022_PROGRAM_ID, token_interface::Mint};
use spl_tlv_account_resolution::{account::ExtraAccountMeta, state::ExtraAccountMetaList};
use spl_transfer_hook_interface::{error::TransferHookError, instruction::ExecuteInstruction};

use crate::{
    AnchorExtraAccountMeta, CPIRule, GuardV1, MetadataAdditionalFieldRule, TransferAmountRule,
    EXTRA_ACCOUNT_METAS, GUARD_V1, WEN_TOKEN_GUARD,
};

#[derive(Accounts)]
#[instruction(
    metas: Vec<AnchorExtraAccountMeta>,
    cpi_rule: Option<CPIRule>,
    transfer_amount_rule: Option<TransferAmountRule>,
    addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
)]
pub struct Initialize<'info> {
    /// CHECK: This account's data is a buffer of TLV data
    #[account(
        init,
        space = ExtraAccountMetaList::size_of(metas.len()).unwrap(),
        // space = 8 + 4 + 2 * 35,
        seeds = [EXTRA_ACCOUNT_METAS.as_ref(), mint.key().as_ref()],
        bump,
        payer = payer,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [
            WEN_TOKEN_GUARD.as_ref(),
            GUARD_V1.as_ref(),
            mint.key().as_ref()
        ],
        bump,
        payer = payer,
        space = GuardV1::size_of(cpi_rule, transfer_amount_rule, addition_fields_rule),
    )]
    pub guard_account: Account<'info, GuardV1>,

    #[account(mint::token_program = TOKEN_2022_PROGRAM_ID)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    // TODO: SWAP FOR ALTERNATIVE (READ METADATA AUTHORITY FROM TLV DATA[?])
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn processor(
    ctx: Context<Initialize>,
    metas: Vec<AnchorExtraAccountMeta>,
    cpi_rule: Option<CPIRule>,
    transfer_amount_rule: Option<TransferAmountRule>,
    addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
) -> Result<()> {
    let guard_account = &mut ctx.accounts.guard_account;
    let extra_metas_account = &ctx.accounts.extra_metas_account;
    let mint = &ctx.accounts.mint;
    let mint_authority = &ctx.accounts.mint_authority;

    if mint_authority.key()
        != mint.mint_authority.ok_or(Into::<ProgramError>::into(
            TransferHookError::MintHasNoMintAuthority,
        ))?
    {
        Err(Into::<ProgramError>::into(
            TransferHookError::IncorrectMintAuthority,
        ))?;
    }

    let metas = metas
        .into_iter()
        .map(|meta| meta.into())
        .collect::<Vec<ExtraAccountMeta>>();
    let mut data = extra_metas_account.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &metas)?;

    let guard_account_bump = ctx.bumps.guard_account;

    guard_account.set_inner(GuardV1::new(
        guard_account_bump,
        cpi_rule,
        transfer_amount_rule,
        addition_fields_rule,
    ));

    Ok(())
}
