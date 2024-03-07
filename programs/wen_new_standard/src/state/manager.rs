use anchor_lang::prelude::*;

/// Data struct for a `Manager`
#[account()]
#[derive(InitSpace)]
pub struct Manager {}
impl Manager {
    /// Creates a new `Manager` state
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for Manager {
    fn default() -> Self {
        Self::new()
    }
}
