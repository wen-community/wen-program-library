use anchor_lang::prelude::*;

#[account()]
#[derive(InitSpace)]
pub struct ApproveAccount {
    pub slot: u64
}
