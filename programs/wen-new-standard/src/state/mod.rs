use anchor_lang::solana_program::pubkey::Pubkey;

pub const GROUP_ACCOUNT_SEED: &[u8] = b"group";
pub const MEMBER_ACCOUNT_SEED: &[u8] = b"member";

pub const TOKEN22: Pubkey = anchor_spl::token_2022::ID;

pub mod group;
pub mod member;

pub use group::*;
pub use member::*;
