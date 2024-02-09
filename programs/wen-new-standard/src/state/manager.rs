use anchor_lang::prelude::*;

/// Data struct for a `Manager`
#[account()]
pub struct Manager {}
impl Manager {
    pub const LEN: usize = 8;
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
