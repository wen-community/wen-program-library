use anchor_lang::prelude::*;
use libreplex_shared::wrapped_sol;
use rarible_editions::program::RaribleEditions;

use crate::{EditionsControls, Phase};

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct InitialisePhaseInput {
    pub price_amount: u64,
    pub price_token: Pubkey,
    pub start_time: i64,
    pub max_mints_per_wallet: u64,
    pub max_mints_total: u64,
    pub end_time: i64,
    pub is_private: bool,
    pub merkle_root: Option<[u8; 32]>,
}

#[derive(Accounts)]
#[instruction(input: InitialisePhaseInput)]
pub struct AddPhaseCtx<'info> {
    #[account(mut,
        realloc = EditionsControls::get_size(editions_controls.phases.len()+1),
        realloc::zero = false,
        realloc::payer = payer
        )]
    pub editions_controls: Account<'info, EditionsControls>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // can be different from payer for PDA integration
    #[account(mut,
        constraint = editions_controls.creator == creator.key())]
    pub creator: Signer<'info>,

    #[account()]
    pub system_program: Program<'info, System>,

    /// CHECK: address checked
    #[account(address = spl_token_2022::ID)]
    pub token_program: AccountInfo<'info>,

    pub rarible_editions_program: Program<'info, RaribleEditions>,
}

pub fn add_phase(ctx: Context<AddPhaseCtx>, input: InitialisePhaseInput) -> Result<()> {
    if !input.price_token.eq(&wrapped_sol::ID) {
        panic!("Only native price currently supported")
    }

    if input.is_private && input.merkle_root.is_none() {
        panic!("Merkle root must be provided for private phases");
    }

    let editions_controls = &mut ctx.accounts.editions_controls;

    editions_controls.phases.push(Phase {
        price_amount: input.price_amount,
        price_token: input.price_token,
        start_time: input.start_time,
        max_mints_per_wallet: input.max_mints_per_wallet,
        active: true, // everything starts out as active -
        end_time: input.end_time,
        max_mints_total: input.max_mints_total,
        current_mints: 0,
        is_private: input.is_private,
        merkle_root: input.merkle_root,
        padding: [0; 200],
    });

    Ok(())
}
