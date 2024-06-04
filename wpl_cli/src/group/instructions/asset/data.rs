use clap::Parser;
use solana_sdk::pubkey::Pubkey;

#[derive(Debug, Parser, Clone)]
pub struct AssetArgs {
    /// Collection mint
    #[arg(short = 'g', long, value_parser = clap::value_parser!(Pubkey))]
    pub group_mint: Pubkey,
    /// Asset mint
    #[arg(short = 'm', long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
}
