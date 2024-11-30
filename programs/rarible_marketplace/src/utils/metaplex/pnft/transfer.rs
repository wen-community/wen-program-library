use crate::utils::metaplex::mplx_transfer::{ExtraTransferParams, TransferMetaplexNft};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::Key;
use mpl_token_metadata::{
    accounts::Metadata,
    instructions::TransferBuilder,
    types::{AuthorizationData, ProgrammableConfig, TokenStandard, TransferArgs},
};

use super::utils::get_is_nft;

pub fn metaplex_transfer<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, TransferMetaplexNft<'info>>,
    params: ExtraTransferParams<'info>,
    amount: u64,
) -> Result<()> {
    let metadata = Metadata::safe_deserialize(&ctx.accounts.metadata.data.borrow()[..])?;

    let edition_key = if get_is_nft(&metadata) {
        Some(ctx.accounts.edition.key())
    } else {
        None
    };

    let mut builder = TransferBuilder::new();
    builder
        .authority(ctx.accounts.authority.to_account_info().key())
        .token_owner(ctx.accounts.source_owner.to_account_info().key())
        .token(ctx.accounts.source_ta.to_account_info().key())
        .destination_owner(ctx.accounts.destination_owner.to_account_info().key())
        .destination_token(ctx.accounts.destination_ta.to_account_info().key())
        .mint(ctx.accounts.mint.to_account_info().key())
        .metadata(ctx.accounts.metadata.to_account_info().key())
        .payer(ctx.accounts.payer.to_account_info().key());

    if let Some(edition_key_value) = edition_key {
        builder.edition(Some(edition_key_value));
    }

    let mut account_infos = if edition_key.is_some() {
        vec![
            ctx.accounts.source_ta.to_account_info(),
            ctx.accounts.source_owner.to_account_info(),
            ctx.accounts.destination_ta.to_account_info(),
            ctx.accounts.destination_owner.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.edition.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.instructions.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.ata_program.to_account_info(),
        ]
    } else {
        vec![
            ctx.accounts.source_ta.to_account_info(),
            ctx.accounts.source_owner.to_account_info(),
            ctx.accounts.destination_ta.to_account_info(),
            ctx.accounts.destination_owner.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.instructions.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.ata_program.to_account_info(),
        ]
    };

    if let Some(standard) = metadata.token_standard {
        if standard == TokenStandard::ProgrammableNonFungible {
            //1. add to builder
            builder
                .token_record(Some(params.owner_token_record.clone().unwrap().key()))
                .destination_token_record(Some(params.dest_token_record.clone().unwrap().key()));

            //2. add to accounts (if try to pass these for non-pNFT, will get owner errors, since they don't exist)
            account_infos.push(params.owner_token_record.unwrap().to_account_info());
            account_infos.push(params.dest_token_record.unwrap().to_account_info());
        }
    }

    //if auth rules passed in, validate & include it in CPI call
    if let Some(config) = metadata.programmable_config {
        match config {
            ProgrammableConfig::V1 { rule_set } => {
                if let Some(rule_set) = rule_set {
                    //safe to unwrap here, it's expected
                    let authorization_rules = params.authorization_rules.unwrap();
                    let rules_program = params.authorization_rules_program.unwrap();

                    //1. validate
                    if rule_set != *authorization_rules.key {
                        // return Err(error!("bad rule set")); // fix this
                    }

                    //2. add to builder
                    builder.authorization_rules(Some(*authorization_rules.key));
                    builder.authorization_rules_program(Some(*rules_program.key));

                    //3. add to accounts
                    account_infos.push(authorization_rules.to_account_info());
                    account_infos.push(rules_program.to_account_info());
                }
            }
        }
    }

    let transfer_ix = builder
        .transfer_args(TransferArgs::V1 {
            amount,
            authorization_data: params.authorization_data.map(AuthorizationData::from),
        })
        .instruction();

    invoke_signed(&transfer_ix, &account_infos, ctx.signer_seeds)?;

    Ok(())
}
