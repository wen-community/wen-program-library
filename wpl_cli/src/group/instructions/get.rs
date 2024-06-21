use anyhow::{anyhow, Result};

use clap::Parser;
use solana_sdk::pubkey::Pubkey;
use spl_token_2022::{
    extension::{BaseStateWithExtensions, StateWithExtensions},
    state::Mint,
};
use spl_token_metadata_interface::state::TokenMetadata;
use wen_new_standard::accounts::TokenGroup;

use crate::{utils::derive_group_account, Context};

#[derive(Debug, Parser, Clone)]
pub struct GetArgs {
    /// Collection address
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
}

pub async fn run(context: Context, args: GetArgs) -> Result<()> {
    let Context { client, .. } = context;

    let mint_data = match client.get_account_data(&args.mint).await {
        Ok(mint_data) => mint_data,
        Err(_) => return Err(anyhow!("Unable to fetch collection mint data")),
    };

    let group_pubkey = derive_group_account(&args.mint);
    let group_data = client
        .get_account_data(&group_pubkey)
        .await
        .unwrap_or(vec![]);

    let mint = StateWithExtensions::<Mint>::unpack(&mint_data)?;
    let metadata = mint.get_variable_len_extension::<TokenMetadata>()?;

    log::info!("Collection mint: {:?}", args.mint.to_string());
    log::info!("Collection name: {:?}", metadata.name);
    log::info!("Collection symbol: {:?}", metadata.symbol);
    log::info!("Collection URI: {:?}", metadata.uri);
    if metadata.additional_metadata.len() > 0 {
        log::info!("Collection Additional metadata ------");
        for (key, value) in metadata.additional_metadata {
            log::info!("(Key) {:?}: (Value) {:?}", key, value);
        }
    }
    if group_data.len() > 0 {
        let group = TokenGroup::from_bytes(&group_data)?;
        log::info!(
            "Collection update authority: {:?}",
            group.update_authority.to_string()
        );
        log::info!("Collection current size: {:?}", group.size);
        log::info!("Collection maximum size: {:?}", group.max_size);
    }

    Ok(())
}
