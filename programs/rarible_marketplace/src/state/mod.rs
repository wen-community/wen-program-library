pub const MARKET_SEED: &[u8] = b"market";
pub const ORDER_SEED: &[u8] = b"order";
pub const VERIFICATION_SEED: &[u8] = b"verification";

pub const TOKEN_PID: &str = "";
pub const TOKEN_EXT_PID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
pub const BUBBLEGUM_PID: &str = "";

pub const METAPLEX_PID: &str = "";
pub const WNS_PID: &str = "wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM";

pub mod market;
pub mod order;

pub use market::*;
pub use order::*;
