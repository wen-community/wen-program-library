use anchor_lang::prelude::*;

/// Data struct for a `TokenGroupMember`
#[account()]
#[derive(InitSpace)]
pub struct TokenGroupMember {
    /// The associated mint, used to counter spoofing to be sure that member
    /// belongs to a particular mint
    pub mint: Pubkey,
    /// The pubkey of the `TokenGroup`
    pub group: Pubkey,
    /// The member number
    pub member_number: u32,
}
impl TokenGroupMember {
    /// Creates a new `TokenGroupMember` state
    pub fn new(mint: &Pubkey, group: &Pubkey, member_number: u32) -> Self {
        Self {
            mint: *mint,
            group: *group,
            member_number,
        }
    }
}
