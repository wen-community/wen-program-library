use anchor_lang::prelude::*;
use anchor_spl::{token_2022::spl_token_2022::ID as TOKEN_2022_PROGRAM_ID, token_interface::Mint};
use spl_tlv_account_resolution::{account::ExtraAccountMeta, state::ExtraAccountMetaList};
use spl_transfer_hook_interface::{error::TransferHookError, instruction::ExecuteInstruction};

use crate::{AnchorExtraAccountMeta, EXTRA_ACCOUNT_METAS};

#[derive(Accounts)]
#[instruction(metas: Vec<AnchorExtraAccountMeta>)]
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
        mint::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn processor(ctx: Context<Initialize>, metas: Vec<AnchorExtraAccountMeta>) -> Result<()> {
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

    let metas: Vec<ExtraAccountMeta> = metas.into_iter().map(|meta| meta.into()).collect();
    let mut data = extra_metas_account.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &metas)?;

    Ok(())
}
