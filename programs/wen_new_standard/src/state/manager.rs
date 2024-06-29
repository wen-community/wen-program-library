use anchor_lang::prelude::*;

/// Data struct for a `Manager`
#[account()]
#[derive(InitSpace)]
pub struct Manager {
    pub bump: u8,
}

impl Manager {
    /// Creates a new `Manager` state
    pub fn new(bump: u8) -> Self {
        Self { bump }
    }
}