use anyhow::Result;

use clap::Parser;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_associated_token_account::get_associated_token_address_with_program_id;
use spl_token_2022::{instruction::approve_checked, ID as TOKEN_PROGRAM_ID};
use wen_new_standard::instructions::FreezeMintAccount;

use crate::utils::derive_manager_account;

#[derive(Debug, Parser, Clone)]
pub struct FreezeArgs {
    /// Member mint
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
    /// Is signing authority delegate?
    #[arg(short = 'd', long, default_value_t = false)]
    pub is_delegate: bool,
}

pub async fn run(async_client: RpcClient, keypair: Keypair, args: FreezeArgs) -> Result<()> {
    let payer = keypair.pubkey();
    let recent_blockhash = async_client.get_latest_blockhash().await?;

    let mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let mint_token_account = get_associated_token_address_with_program_id(
        &keypair_pubkey,
        &mint_pubkey,
        &TOKEN_PROGRAM_ID,
    );
    let manager = derive_manager_account();

    let mut instructions = vec![];

    if !args.is_delegate {
        instructions.push(approve_checked(
            &TOKEN_PROGRAM_ID,
            &mint_token_account,
            &mint_pubkey,
            &keypair_pubkey,
            &keypair_pubkey,
            &[],
            1,
            0,
        )?);
    }

    let create_mint_account = FreezeMintAccount {
        user: keypair_pubkey,
        delegate_authority: keypair_pubkey,
        manager,
        mint: mint_pubkey,
        mint_token_account,
        token_program: TOKEN_PROGRAM_ID,
    };

    let create_mint_account_ix = create_mint_account.instruction();
    instructions.push(create_mint_account_ix);

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &instructions,
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = async_client
        .send_and_confirm_transaction(&transaction)
        .await?;

    println!(
        "Member mint frozen successfully! Signature: {:?}",
        signature
    );

    Ok(())
}
