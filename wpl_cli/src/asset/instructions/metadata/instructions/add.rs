use anyhow::Result;

use solana_client::nonblocking::rpc_client::RpcClient;
use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    signature::Keypair,
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_token_2022::ID as TOKEN_PROGRAM_ID;
use wen_new_standard::instructions::{AddMetadata, AddMetadataInstructionArgs};

use crate::asset::{parse_add_metadata_pairs, MetadataArgs};

pub async fn run(client: RpcClient, keypair: Keypair, args: MetadataArgs) -> Result<()> {
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let add_metadata = AddMetadata {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        mint: mint_pubkey,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let add_metadata_args = parse_add_metadata_pairs(args.metadata_path)?;

    let add_metadata_ix = add_metadata.instruction(AddMetadataInstructionArgs {
        args: add_metadata_args,
    });

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[add_metadata_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client
        .send_and_confirm_transaction(&transaction)
        .await?;

    log::info!(
        "Added metadata for asset {:?} successfully! Signature: {:?}",
        mint_pubkey.to_string(),
        signature
    );

    Ok(())
}
