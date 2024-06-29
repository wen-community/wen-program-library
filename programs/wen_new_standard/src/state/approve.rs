use anchor_lang::prelude::*;

#[account()]
#[derive(InitSpace)]
pub struct ApproveAccount {
    pub slot: u64,
    /// Token PDA bump
    pub bump: u8,
}
