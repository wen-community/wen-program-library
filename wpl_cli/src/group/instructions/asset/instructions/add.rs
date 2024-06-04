use anyhow::Result;

use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_token_2022::ID as TOKEN_PROGRAM_ID;
use wen_new_standard::instructions::AddMintToGroup;

use crate::{group::AssetArgs, utils::*, Context};

pub async fn run(context: Context, args: AssetArgs) -> Result<()> {
    let Context { client, keypair } = context;
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let group_mint_pubkey = args.group_mint;
    let member_mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let group = derive_group_account(&group_mint_pubkey);
    let member = derive_member_account(&member_mint_pubkey);
    let manager = derive_manager_account();

    let add_mint_to_group = AddMintToGroup {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        group,
        manager,
        member,
        mint: member_mint_pubkey,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let add_mint_to_group_ix = add_mint_to_group.instruction();

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[add_mint_to_group_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client.send_and_confirm_transaction(&transaction).await?;

    log::info!(
        "Asset {:?} added to collection {:?} successfully!\nAsset PDA: {:?}\nSignature: {:?}",
        member_mint_pubkey.to_string(),
        group_mint_pubkey.to_string(),
        member.to_string(),
        signature
    );

    Ok(())
}
