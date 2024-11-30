use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

pub const SYMBOL_LIMIT: usize = 100;
pub const NAME_LIMIT: usize = 400;
pub const URI_LIMIT: usize = 1200;
pub const META_LIST_ACCOUNT_SEED: &[u8] = b"extra-account-metas";
pub const APPROVE_ACCOUNT_SEED: &[u8] = b"approve-account";
pub const ROYALTY_BASIS_POINTS_FIELD: &str = "royalty_basis_points";
pub const PLATFORM_FEE_VALUE: &str = "platform_fee_value";
// Define constants for metadata keys

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub enum DeploymentStatus {
    Initialised,
    MintedOut,
}

#[account]
#[derive(InitSpace)]
pub struct EditionsDeployment {
    pub creator: Pubkey,
    // set to 0 for unlimited
    pub max_number_of_tokens: u64,

    pub number_of_tokens_issued: u64,

    // set to system account for no cosign
    pub cosigner_program_id: Pubkey,

    pub group_mint: Pubkey,

    pub group: Pubkey,

    #[max_len(SYMBOL_LIMIT)]
    pub symbol: String,

    #[max_len(NAME_LIMIT)]
    pub item_base_name: String,

    #[max_len(URI_LIMIT)]
    pub item_base_uri: String,

    pub item_name_is_template: bool,

    pub item_uri_is_template: bool,

    pub padding: [u8; 98],
}

// slightly more extended
#[account]
pub struct HashlistMarker {
    pub editions_deployment: Pubkey,
    pub mint: Pubkey,
}

impl HashlistMarker {
    pub const SIZE: usize = 8 + 32 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MintAndOrder {
    pub mint: Pubkey,
    pub order: u64,
}

// this is a genuine hashlist for the launch
#[account]
pub struct Hashlist {
    pub deployment: Pubkey,
    pub issues: Vec<MintAndOrder>,
}
