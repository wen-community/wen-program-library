use anyhow::Result;

use clap::Parser;
use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_associated_token_account::{
    get_associated_token_address_with_program_id, ID as ASSOCIATED_TOKEN_PROGRAM_ID,
};
use spl_token_2022::ID as TOKEN_PROGRAM_ID;
use wen_new_standard::{
    instructions::{CreateMintAccount, CreateMintAccountInstructionArgs},
    types::CreateMintAccountArgs,
};

use crate::{utils::derive_manager_account, Context};

#[derive(Debug, Parser, Clone)]
pub struct CreateArgs {
    /// Name of the asset
    #[arg(short, long)]
    pub name: String,
    /// Symbol of the asset
    #[arg(short, long)]
    pub symbol: String,
    /// URI of the asset
    #[arg(short, long)]
    pub uri: String,
    /// Receiver address of the asset
    #[arg(short = 'R', long, value_parser = clap::value_parser!(Pubkey))]
    pub receiver: Option<Pubkey>,
    /// Optional permanent delegate
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub permanent_delegate: Option<Pubkey>,
}

pub async fn run(context: Context, args: CreateArgs) -> Result<()> {
    let Context { client, keypair } = context;
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let mint_keypair = Keypair::new();
    let mint_pubkey = mint_keypair.pubkey();
    let keypair_pubkey = keypair.pubkey();

    let receiver = if let Some(receiver) = args.receiver {
        receiver
    } else {
        keypair_pubkey
    };

    let mint_token_account =
        get_associated_token_address_with_program_id(&receiver, &mint_pubkey, &TOKEN_PROGRAM_ID);
    let manager = derive_manager_account();

    let create_mint_account = CreateMintAccount {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        manager,
        mint: mint_pubkey,
        receiver,
        mint_token_account,
        associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let create_mint_account_ix =
        create_mint_account.instruction(CreateMintAccountInstructionArgs {
            args: CreateMintAccountArgs {
                name: args.name,
                symbol: args.symbol,
                uri: args.uri,
                permanent_delegate: args.permanent_delegate,
            },
        });

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[create_mint_account_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction =
        VersionedTransaction::try_new(transaction_message, &[&keypair, &mint_keypair])?;

    let signature = client.send_and_confirm_transaction(&transaction).await?;

    log::info!(
        "Asset created successfully! Asset mint: {:?}\nSignature: {:?}",
        mint_pubkey.to_string(),
        signature
    );

    Ok(())
}
