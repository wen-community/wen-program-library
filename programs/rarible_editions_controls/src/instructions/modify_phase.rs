use anchor_lang::prelude::*;
use libreplex_shared::wrapped_sol;
use rarible_editions::program::RaribleEditions;

use crate::{EditionsControls, Phase};

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct ModifyPhaseInput {
    pub price_amount: u64,
    pub price_token: Pubkey,
    pub start_time: i64,
    pub max_mints_per_wallet: u64,
    pub max_mints_total: u64,
    pub end_time: i64,
    pub is_private: bool,
    pub active: bool,
    pub merkle_root: Option<[u8; 32]>,
    pub phase_index: u32,
}

#[derive(Accounts)]
#[instruction(input: ModifyPhaseInput)]
pub struct ModifyPhaseCtx<'info> {
    #[account(mut)]
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

pub fn modify_phase(ctx: Context<ModifyPhaseCtx>, input: ModifyPhaseInput) -> Result<()> {
    // Cast phase_index to usize after ensuring it's non-negative
    let phase_index = input.phase_index as usize;
    let editions_controls = &mut ctx.accounts.editions_controls;
    if !input.price_token.eq(&wrapped_sol::ID) {
        panic!("Only native price currently supported")
    }

    if input.is_private && input.merkle_root.is_none() {
        panic!("Merkle root must be provided for private phases");
    }

    // Now safely index into phases using phase_index
    let phase = &mut editions_controls.phases[phase_index];
    phase.price_amount = input.price_amount;
    phase.price_token = input.price_token;
    phase.start_time = input.start_time;
    phase.max_mints_per_wallet = input.max_mints_per_wallet;
    phase.active = input.active;
    phase.end_time = input.end_time;
    phase.max_mints_total = input.max_mints_total;
    phase.is_private = input.is_private;
    phase.merkle_root = input.merkle_root;

    Ok(())
}
