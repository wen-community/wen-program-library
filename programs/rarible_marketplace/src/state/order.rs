use anchor_lang::prelude::*;
use num_enum::IntoPrimitive;

pub const ORDER_VERSION: u8 = 1;

#[account()]
/// order account - each listing has one order account
pub struct Order {
    /// order account version
    pub version: u8,
    /// nonce for uniqueness
    pub nonce: Pubkey,
    /// market to which the order belongs to, must be init'd
    pub market: Pubkey,
    /// owner of the order account
    pub owner: Pubkey,
    /// type of order - buy/sell
    pub side: u8,
    /// number of bids order is making
    /// always for 1 for sell
    pub size: u64,
    /// bid amount in lamports
    pub price: u64,
    /// order state - ready/partial/closed
    pub state: u8,
    /// order account creation time
    pub init_time: i64,
    /// last time the order was edited
    pub last_edit_time: i64,
    /// nft mint in case order is a sell order
    pub nft_mint: Pubkey,
    /// mint for the payment, default pubkey if SOL
    pub payment_mint: Pubkey,
    /// fees on for this order
    pub fees_on: bool,
    /// reserved space for future changes split up due to serialization constraints
    reserve_0: [u8; 256],
    /// reserved space for future changes
    reserve_1: [u8; 128],
    /// reserved space for future changes
    reserve_2: [u8; 64],
    /// reserved space for future changes
    reserve_3: [u8; 30],
    /// reserved space for future changes
    reserve_4: [u8; 30],
    /// reserved space for future changes
    reserve_5: [u8; 3],
}

#[derive(IntoPrimitive)]
#[repr(u8)]
pub enum OrderEditType {
    Init,
    Edit,
    Fill,
    Close,
    FillAndClose,
}

#[event]
pub struct OrderEditEvent {
    pub edit_type: u8,
    pub address: String,
    pub version: u8,
    pub nonce: String,
    pub market: String,
    pub owner: String,
    pub side: u8,
    pub size: u64,
    pub price: u64,
    pub state: u8,
    pub init_time: i64,
    pub last_edit_time: i64,
    pub nft_mint: String,
    pub payment_mint: String,
    pub market_identifier: String,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, IntoPrimitive)]
#[repr(u8)]
/// bid type for order
pub enum OrderSide {
    /// bid for buying NFT
    Buy,
    /// bid for selling NFT
    Sell,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, IntoPrimitive)]
#[repr(u8)]
/// state of the order
pub enum OrderState {
    /// order account has been created and ready to be filled
    Ready,
    /// some of the bids have been filled, used only in UI to show some orders have been filled
    Partial,
    /// all bids have been filled and the order account is now closed
    Closed,
}

impl Order {
    /// initialize a new order account
    #[allow(clippy::too_many_arguments)]
    pub fn init(
        &mut self,
        market: Pubkey,
        owner: Pubkey,
        nonce: Pubkey,
        nft_mint: Pubkey,
        payment_mint: Pubkey,
        time: i64,
        side: u8,
        size: u64,
        price: u64,
        state: u8,
        fees_on: bool,
    ) {
        self.version = ORDER_VERSION;
        self.market = market;
        self.nonce = nonce;
        self.owner = owner;
        self.nft_mint = nft_mint;
        self.payment_mint = payment_mint;
        self.side = side;
        self.size = size;
        self.price = price;
        self.state = state;
        self.init_time = time;
        self.last_edit_time = time;
        self.fees_on = fees_on;
    }

    /// edit a buy order account
    /// if size is 0, order is closed
    /// any size change is considered partial
    pub fn edit_order(
        &mut self,
        new_price: u64,
        new_payment_mint: Pubkey,
        new_size: u64,
        time: i64,
    ) {
        self.size = new_size;
        self.price = new_price;
        self.payment_mint = new_payment_mint;
        self.last_edit_time = time;
    }

    /// return true if the order is active
    pub fn is_active(state: u8) -> bool {
        state != <OrderState as Into<u8>>::into(OrderState::Closed)
    }

    pub fn get_edit_event(
        &mut self,
        address: Pubkey,
        market_identifier: Pubkey,
        edit_type: OrderEditType,
    ) -> OrderEditEvent {
        OrderEditEvent {
            edit_type: edit_type.into(),
            address: address.to_string(),
            version: self.version,
            nonce: self.nonce.to_string(),
            market: self.market.to_string(),
            owner: self.owner.to_string(),
            side: self.side,
            size: self.size,
            price: self.price,
            state: self.state,
            init_time: self.init_time,
            last_edit_time: self.last_edit_time,
            nft_mint: self.nft_mint.to_string(),
            payment_mint: self.payment_mint.to_string(),
            market_identifier: market_identifier.to_string(),
        }
    }
}
