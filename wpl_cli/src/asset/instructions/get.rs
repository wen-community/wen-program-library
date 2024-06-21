use anyhow::{anyhow, Result};

use clap::Parser;
use solana_sdk::pubkey::Pubkey;
use spl_token_2022::{
    extension::{BaseStateWithExtensions, StateWithExtensions},
    state::Mint,
};
use spl_token_metadata_interface::state::TokenMetadata;
use wen_new_standard::accounts::TokenGroupMember;

use crate::{utils::derive_member_account, Context};

#[derive(Debug, Parser, Clone)]
pub struct GetArgs {
    /// Asset address
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
}

pub async fn run(context: Context, args: GetArgs) -> Result<()> {
    let Context { client, .. } = context;

    let mint_data = match client.get_account_data(&args.mint).await {
        Ok(mint_data) => mint_data,
        Err(_) => return Err(anyhow!("Unable to fetch asset mint data")),
    };

    let member_pubkey = derive_member_account(&args.mint);
    let member_data = client
        .get_account_data(&member_pubkey)
        .await
        .unwrap_or(vec![]);

    let mint = StateWithExtensions::<Mint>::unpack(&mint_data)?;
    let metadata = mint.get_variable_len_extension::<TokenMetadata>()?;

    log::info!("Asset mint: {:?}", args.mint.to_string());
    if member_data.len() > 0 {
        let member = TokenGroupMember::from_bytes(&member_data)?;
        log::info!("Asset under collection PDA: {:?}", member.group.to_string());
        log::info!("Asset member count: {:?}", member.member_number);
    }
    log::info!("Asset name: {:?}", metadata.name);
    log::info!("Asset symbol: {:?}", metadata.symbol);
    log::info!("Asset URI: {:?}", metadata.uri);
    if metadata.additional_metadata.len() > 0 {
        log::info!("Asset Additional metadata ------");
        for (key, value) in metadata.additional_metadata {
            log::info!("(Key) {:?} -- (Value) {:?}", key, value);
        }
    }

    Ok(())
}
