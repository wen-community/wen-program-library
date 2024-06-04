use anyhow::Result;

use clap::Parser;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    pubkey::Pubkey,
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_associated_token_account::get_associated_token_address_with_program_id;
use spl_token_2022::ID as TOKEN_PROGRAM_ID;
use wen_new_standard::instructions::BurnMintAccount;

use crate::{utils::derive_manager_account, Context};

#[derive(Debug, Parser, Clone)]
pub struct BurnArgs {
    /// Asset address
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
}

pub async fn run(context: Context, args: BurnArgs) -> Result<()> {
    let Context { client, keypair } = context;
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let mint_token_account = get_associated_token_address_with_program_id(
        &keypair_pubkey,
        &mint_pubkey,
        &TOKEN_PROGRAM_ID,
    );
    let manager = derive_manager_account();

    let burn_mint_account = BurnMintAccount {
        user: keypair_pubkey,
        payer: keypair_pubkey,
        manager,
        mint: mint_pubkey,
        mint_token_account,
        token_program: TOKEN_PROGRAM_ID,
    };

    let burn_mint_account_ix = burn_mint_account.instruction();

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[burn_mint_account_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client.send_and_confirm_transaction(&transaction).await?;

    log::info!("Asset burnt successfully! Signature: {:?}", signature);

    Ok(())
}
