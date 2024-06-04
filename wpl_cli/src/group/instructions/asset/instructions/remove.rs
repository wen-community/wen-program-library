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
use wen_new_standard::instructions::RemoveMintFromGroup;

use crate::{group::AssetArgs, utils::*};

pub async fn run(client: RpcClient, keypair: Keypair, args: AssetArgs) -> Result<()> {
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let group_mint_pubkey = args.group_mint;
    let member_mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let group = derive_group_account(&group_mint_pubkey);
    let member = derive_member_account(&member_mint_pubkey);
    let manager = derive_manager_account();

    let remove_mint_from_group = RemoveMintFromGroup {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        group,
        manager,
        member,
        mint: member_mint_pubkey,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let remove_mint_from_group_ix = remove_mint_from_group.instruction();

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[remove_mint_from_group_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client
        .send_and_confirm_transaction(&transaction)
        .await?;

    log::info!(
        "Asset {:?} removed from collection {:?} successfully! Signature: {:?}",
        member_mint_pubkey.to_string(),
        group_mint_pubkey.to_string(),
        signature
    );

    Ok(())
}
