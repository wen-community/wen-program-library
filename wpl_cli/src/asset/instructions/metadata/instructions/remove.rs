use anyhow::Result;

use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_token_2022::ID as TOKEN_2022_PROGRAM_ID;
use wen_new_standard::instructions::{RemoveMetadata, RemoveMetadataInstructionArgs};

use crate::{
    asset::{parse_remove_metadata_pairs, MetadataArgs},
    Context,
};

pub async fn run(context: Context, args: MetadataArgs) -> Result<()> {
    let Context { client, keypair } = context;
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let remove_metadata = RemoveMetadata {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        mint: mint_pubkey,
        token_program: TOKEN_2022_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let remove_metadata_args = parse_remove_metadata_pairs(args.metadata_path)?;

    let remove_metadata_ix = remove_metadata.instruction(RemoveMetadataInstructionArgs {
        args: remove_metadata_args,
    });

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[remove_metadata_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client.send_and_confirm_transaction(&transaction).await?;

    log::info!(
        "Removed metadata for asset {:?} successfully! Signature: {:?}",
        mint_pubkey.to_string(),
        signature
    );

    Ok(())
}
