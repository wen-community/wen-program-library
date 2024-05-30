use std::fs;

use anyhow::{anyhow, Context, Result};
use bs58::decode;
use fs::read_to_string as read_path;
use serde_json::from_str as parse_json_str;
use solana_sdk::{pubkey::Pubkey, signature::Keypair};
use wen_new_standard::ID as WEN_NEW_STANDARD_PROGRAM_ID;

pub const MANAGER_SEED: &[u8] = b"manager";
pub const GROUP_ACCOUNT_SEED: &[u8] = b"group";
pub const MEMBER_ACCOUNT_SEED: &[u8] = b"member";
pub const META_LIST_ACCOUNT_SEED: &[u8] = b"extra-account-metas";
pub const APPROVE_ACCOUNT_SEED: &[u8] = b"approve-account";

pub fn parse_keypair(keypair_path: &String) -> Result<Keypair> {
    let secret_string: String = read_path(keypair_path).context("Can't find key file")?;
    let secret_bytes: Vec<u8> = match parse_json_str(&secret_string) {
        Ok(bytes) => bytes,
        Err(_) => match decode(&secret_string.trim()).into_vec() {
            Ok(bytes) => bytes,
            Err(_) => return Err(anyhow!("Unsupported key type!")),
        },
    };

    let keypair = Keypair::from_bytes(&secret_bytes)?;
    Ok(keypair)
}

pub fn derive_group_account(mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[GROUP_ACCOUNT_SEED, mint.as_ref()],
        &WEN_NEW_STANDARD_PROGRAM_ID,
    )
    .0
}

pub fn derive_manager_account() -> Pubkey {
    Pubkey::find_program_address(&[MANAGER_SEED], &WEN_NEW_STANDARD_PROGRAM_ID).0
}

pub fn derive_extra_metas_account(mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[META_LIST_ACCOUNT_SEED, mint.as_ref()],
        &WEN_NEW_STANDARD_PROGRAM_ID,
    )
    .0
}
