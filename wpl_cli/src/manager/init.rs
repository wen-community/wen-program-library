use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    message::{v0, VersionedMessage},
    signature::Keypair,
    signer::Signer,
    transaction::VersionedTransaction,
};
use wen_new_standard::instructions::InitManagerAccount;

use crate::utils::derive_manager_account;

pub async fn run(client: RpcClient, keypair: Keypair) -> Result<()> {
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let manager = derive_manager_account();

    let init_manager_account = InitManagerAccount {
        payer,
        manager,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let init_manager_account_ix = init_manager_account.instruction();

    let transaction_message = VersionedMessage::V0(v0::Message::try_compile(
        &payer,
        &[init_manager_account_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client
        .send_and_confirm_transaction(&transaction)
        .await?;

    log::info!(
        "Manager initialized successfully! Signature: {:?}",
        signature
    );

    Ok(())
}
