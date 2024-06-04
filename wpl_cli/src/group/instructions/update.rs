use anyhow::Result;

use clap::Parser;
use solana_program::system_program::ID as SYSTEM_PROGRAM_ID;
use solana_sdk::{
    message::{v0::Message as TransactionMessage, VersionedMessage},
    pubkey::Pubkey,
    signer::Signer,
    transaction::VersionedTransaction,
};
use spl_token_2022::ID as TOKEN_PROGRAM_ID;
use wen_new_standard::{
    instructions::{UpdateGroupAccount, UpdateGroupAccountInstructionArgs},
    types::UpdateGroupAccountArgs,
};

use crate::{utils::derive_group_account, Context};

#[derive(Debug, Parser, Clone)]
pub struct UpdateArgs {
    /// Name of the group mint
    #[arg(short, long)]
    pub name: String,
    /// Symbol of the group mint
    #[arg(short, long)]
    pub symbol: String,
    /// URI of the group mint
    #[arg(short, long)]
    pub uri: String,
    /// Maximum size of the group
    #[arg(short = 'S', long)]
    pub size: u32,
    /// Group account (collection) mint to be updated
    #[arg(short, long, value_parser = clap::value_parser!(Pubkey))]
    pub mint: Pubkey,
}

pub async fn run(context: Context, args: UpdateArgs) -> Result<()> {
    let Context { client, keypair } = context;
    let payer = keypair.pubkey();
    let recent_blockhash = client.get_latest_blockhash().await?;

    let mint_pubkey = args.mint;
    let keypair_pubkey = keypair.pubkey();

    let group = derive_group_account(&mint_pubkey);

    let update_group_account = UpdateGroupAccount {
        payer: keypair_pubkey,
        authority: keypair_pubkey,
        group,
        mint: mint_pubkey,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SYSTEM_PROGRAM_ID,
    };

    let update_group_account_ix =
        update_group_account.instruction(UpdateGroupAccountInstructionArgs {
            args: UpdateGroupAccountArgs {
                name: args.name,
                max_size: args.size,
                symbol: args.symbol,
                uri: args.uri,
            },
        });

    let transaction_message = VersionedMessage::V0(TransactionMessage::try_compile(
        &payer,
        &[update_group_account_ix],
        &[],
        recent_blockhash,
    )?);

    let transaction = VersionedTransaction::try_new(transaction_message, &[&keypair])?;

    let signature = client.send_and_confirm_transaction(&transaction).await?;

    log::info!(
        "Collection updated successfully! Signature: {:?}",
        signature
    );

    Ok(())
}
