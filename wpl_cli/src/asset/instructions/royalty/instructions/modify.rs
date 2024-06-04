use anyhow::Result;

use solana_client::nonblocking::rpc_client::RpcClient;
use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    compute_budget::ComputeBudgetInstruction,
    message::{v0::Message as TransactionMessage, VersionedMessage},
    signature::Keypair,
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_token_2022::ID as TOKEN_PROGRAM_ID;
use wen_new_standard::instructions::{ModifyRoyalties, ModifyRoyaltiesInstructionArgs};

use super::super::RoyaltyArgs;
use crate::asset::parse_update_royalties_args;

pub async fn run(client: RpcClient, keypair: Keypair, args: RoyaltyArgs) -> Result<()> {
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let modify_royalties = ModifyRoyalties {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        mint: mint_pubkey,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let update_royalties_args = parse_update_royalties_args(args.config_path)?;

    let compute_budget_set_units_ix = ComputeBudgetInstruction::set_compute_unit_limit(300_000);

    let modify_royalties_ix = modify_royalties.instruction(ModifyRoyaltiesInstructionArgs {
        args: update_royalties_args,
    });

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[compute_budget_set_units_ix, modify_royalties_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client
        .send_and_confirm_transaction(&transaction)
        .await?;

    log::info!(
        "Modified royalties for asset {:?} successfully! Signature: {:?}",
        mint_pubkey.to_string(),
        signature
    );

    Ok(())
}
