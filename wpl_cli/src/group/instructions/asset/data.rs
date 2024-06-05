use clap::Parser;
use solana_sdk::pubkey::Pubkey;

#[derive(Debug, Parser, Clone)]
pub struct AssetArgs {
    /// Collection mint
    #[arg(short = 'm', long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
    /// Asset mint
    #[arg(short = 'a', long, value_parser = clap::value_parser!(Pubkey))]
    pub asset_mint: Pubkey,
}
