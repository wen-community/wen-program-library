use anchor_lang::prelude::*;
use spl_tlv_account_resolution::account::ExtraAccountMeta;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AnchorExtraAccountMeta {
    pub discriminator: u8,
    pub address_config: [u8; 32],
    pub is_signer: bool,
    pub is_writable: bool,
}

impl From<AnchorExtraAccountMeta> for ExtraAccountMeta {
    fn from(meta: AnchorExtraAccountMeta) -> Self {
        Self {
            discriminator: meta.discriminator,
            address_config: meta.address_config,
            is_signer: meta.is_signer.into(),
            is_writable: meta.is_writable.into(),
        }
    }
}
