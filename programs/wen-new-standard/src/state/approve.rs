use anchor_lang::prelude::*;

#[account()]
pub struct ApproveAccount {
    pub slot: u64,
}

impl ApproveAccount {
    pub const LEN: usize = 8 + 8;
}
