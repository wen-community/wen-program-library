use std::collections::HashMap;

use anchor_lang::prelude::*;
use mpl_token_metadata::{
    accounts::{Metadata, TokenRecord},
    types::{
        AuthorizationData, Payload, PayloadType, ProofInfo, SeedsVec, TokenDelegateRole,
        TokenStandard,
    },
};

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct AuthorizationDataLocal {
    pub payload: Vec<TaggedPayload>,
}

#[allow(clippy::from_over_into)]
impl From<AuthorizationDataLocal> for AuthorizationData {
    fn from(item: AuthorizationDataLocal) -> Self {
        let mut p: HashMap<String, PayloadType> = HashMap::new();
        item.payload.into_iter().for_each(|tp| {
            p.insert(tp.name, PayloadType::try_from(tp.payload).unwrap());
        });

        AuthorizationData {
            payload: Payload { map: p },
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct TaggedPayload {
    name: String,
    payload: PayloadTypeLocal,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub enum PayloadTypeLocal {
    /// A plain `Pubkey`.
    Pubkey(Pubkey),
    /// PDA derivation seeds.
    Seeds(SeedsVecLocal),
    /// A merkle proof.
    MerkleProof(ProofInfoLocal),
    /// A plain `u64` used for `Amount`.
    Number(u64),
}

#[allow(clippy::from_over_into)]
impl Into<PayloadType> for PayloadTypeLocal {
    fn into(self) -> PayloadType {
        match self {
            Self::Pubkey(pubkey) => PayloadType::Pubkey(pubkey),
            Self::Seeds(seeds) => PayloadType::Seeds(SeedsVec::try_from(seeds).unwrap()),
            Self::MerkleProof(proof) => {
                PayloadType::MerkleProof(ProofInfo::try_from(proof).unwrap())
            }
            Self::Number(number) => PayloadType::Number(number),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct SeedsVecLocal {
    /// The vector of derivation seeds.
    pub seeds: Vec<Vec<u8>>,
}

#[allow(clippy::from_over_into)]
impl Into<SeedsVec> for SeedsVecLocal {
    fn into(self) -> SeedsVec {
        SeedsVec { seeds: self.seeds }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct ProofInfoLocal {
    /// The merkle proof.
    pub proof: Vec<[u8; 32]>,
}

#[allow(clippy::from_over_into)]
impl Into<ProofInfo> for ProofInfoLocal {
    fn into(self) -> ProofInfo {
        ProofInfo { proof: self.proof }
    }
}

/// return if nft is pnft
#[inline(always)]
pub fn get_is_pnft(metadata: &Metadata) -> bool {
    if let Some(standard) = &metadata.token_standard {
        if *standard == TokenStandard::ProgrammableNonFungible {
            return true;
        }
    }

    false
}

pub struct TokenDelegate {
    pub address: Pubkey,
    pub role: TokenDelegateRole,
}

/// return if nft has an existing delegate
#[inline(always)]
pub fn get_delegate(token_record_account_info: &AccountInfo) -> Option<TokenDelegate> {
    let token_record_res = TokenRecord::from_bytes(&token_record_account_info.data.borrow()[..]);
    if let Ok(record) = token_record_res {
        if let Some(delegate) = record.delegate {
            if let Some(delegate_role) = record.delegate_role {
                return Some(TokenDelegate {
                    address: delegate,
                    role: delegate_role,
                });
            }
        }
    }
    None
}
/// return if nft is pnft
#[inline(always)]
pub fn get_is_metaplex_nft(nft_account_info: &AccountInfo) -> bool {
    let metadata_res = Metadata::safe_deserialize(&nft_account_info.data.borrow()[..]);
    if let Ok(metadata) = metadata_res {
        get_is_nft(&metadata)
    } else {
        false
    }
}

/// return if metadata is nft
#[inline(always)]
pub fn get_is_nft(metadata: &Metadata) -> bool {
    if let Some(standard) = &metadata.token_standard {
        if *standard == TokenStandard::Fungible {
            return false;
        }
    }
    true
}

#[derive(Clone)]
pub struct PnftParams<'info> {
    pub owner_token_record: Option<AccountInfo<'info>>,
    pub destination_token_record: Option<AccountInfo<'info>>,
    pub authorization_rules: Option<AccountInfo<'info>>,
    pub authorization_data: Option<AuthorizationData>,
    pub authorization_rules_program: Option<AccountInfo<'info>>,
}

#[derive(Clone, Debug)]
pub struct ExistingDelegateParams<'info> {
    pub existing_delegate: AccountInfo<'info>,
    pub existing_delegate_record: AccountInfo<'info>,
}
