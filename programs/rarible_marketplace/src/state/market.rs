use anchor_lang::prelude::*;
use num_enum::IntoPrimitive;

use crate::errors::MarketError;

use super::VERIFICATION_SEED;

pub const MARKET_VERSION: u8 = 1;

#[account()]
pub struct Market {
    /// market account version, used to conditionally parse accounts if changes are made to the struct
    pub version: u8,
    /// identifying of the index to which the NFTs belong to (WNS Collection, Metaplex collection, separate hash)
    pub market_identifier: Pubkey,
    /// initializer of the market - can edit and close the market, admin key
    pub initializer: Pubkey,
    /// state representing the market - open/closed
    pub state: u8,
    /// address that should receive market fees
    pub fee_recipients: [Pubkey; 3],
    /// fee basis points
    pub fee_bps: [u64; 3],
    /// reserved space for future changes
    pub reserve: [u8; 512],
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, IntoPrimitive)]
#[repr(u8)]
pub enum MarketState {
    /// market is open and can be used to create orders
    Open,
    /// market is closed and cannot be used to create orders
    Closed,
}

#[derive(IntoPrimitive)]
#[repr(u8)]
pub enum MarketEditType {
    Init,
}

#[account()]
pub struct MintVerification {
    pub verified: u8,
}

pub fn get_verification_pda(nft_mint: Pubkey, market_address: Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            VERIFICATION_SEED,
            nft_mint.as_ref(),
            market_address.as_ref(),
        ],
        &crate::ID,
    )
}

#[event]
pub struct MarketEditEvent {
    pub edit_type: u8,
    pub address: String,
    pub version: u8,
    pub market_identifier: String,
    pub initializer: String,
    pub state: u8,
    pub fee_recipient: [String; 3],
    pub fee_bps: [u64; 3],
}

impl Market {
    /// initialize a new market
    pub fn init(
        &mut self,
        market_identifier: Pubkey,
        initializer: Pubkey,
        fee_recipients: [Pubkey; 3],
        fee_bps: [u64; 3],
    ) {
        self.version = MARKET_VERSION;
        self.market_identifier = market_identifier;
        self.initializer = initializer;
        self.state = MarketState::Open.into();
        self.fee_recipients = fee_recipients;
        self.fee_bps = fee_bps;
    }

    /// return true if the market is active
    pub fn is_active(state: u8) -> bool {
        state != <MarketState as Into<u8>>::into(MarketState::Closed)
    }

    pub fn verify_fee_accounts<'info>(
        &mut self,
        fee_accounts: Vec<AccountInfo<'info>>,
    ) -> Result<()> {
        let fee_accs = self.fee_recipients;
        let mut i = 0;
        for fee_acc in fee_accs {
            match fee_accounts.get(i) {
                Some(comparison_acc) => {
                    if comparison_acc.key() != fee_acc {
                        return Err(MarketError::InvalidFeeAccount.into());
                    }
                    i = i + 1;
                }
                None => {
                    return Err(MarketError::InvalidFeeAccount.into());
                }
            }
        }

        Ok(())
    }

    pub fn get_edit_event(
        &mut self,
        address: Pubkey,
        edit_type: MarketEditType,
    ) -> MarketEditEvent {
        MarketEditEvent {
            edit_type: edit_type.into(),
            address: address.to_string(),
            version: self.version,
            market_identifier: self.market_identifier.to_string(),
            initializer: self.initializer.to_string(),
            state: self.state,
            fee_recipient: self.fee_recipients.map(|f| f.to_string()),
            fee_bps: self.fee_bps,
        }
    }
}
