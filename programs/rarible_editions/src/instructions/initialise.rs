use crate::shared::{create_token_2022_and_metadata, MintAccounts2022, TokenGroupInput};
use crate::{
    group_extension_program, utils::update_account_lamports_to_minimum_balance, EditionsDeployment,
    Hashlist, NAME_LIMIT, SYMBOL_LIMIT, URI_LIMIT,
};
use anchor_lang::prelude::*;
use solana_program::system_program;
use spl_pod::optional_keys::OptionalNonZeroPubkey;
use spl_token_metadata_interface::state::TokenMetadata;

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct InitialiseInput {
    pub symbol: String,
    pub collection_name: String,
    pub collection_uri: String,
    pub max_number_of_tokens: u64, // this is the max *number* of tokens
    pub creator_cosign_program_id: Option<Pubkey>,
    // add curlies if you want this to be created dynamically. For example
    // ipfs://pippo/{} -> turns into ipfs://pippo/1, ipfs://pippo/2, etc
    // without curlies the url is the same for all mints
    pub item_base_uri: String,
    // add curlies if you want this to be created dynamically. For example
    // hippo #{} -> turns into hippo #0, hippo #1, etc
    // without curlies the url is the same for all mints
    pub item_base_name: String,
}

#[derive(Accounts)]
#[instruction(input: InitialiseInput)]
pub struct InitialiseCtx<'info> {
    #[account(init, payer = payer, space = 8 + EditionsDeployment::INIT_SPACE,
        seeds = ["editions_deployment".as_ref(), input.symbol.as_ref()], bump)]
    pub editions_deployment: Account<'info, EditionsDeployment>,

    /// CHECK: Checked in PDA. Not deserialized because it can be rather big
    #[account(init, seeds = ["hashlist".as_bytes(), 
        editions_deployment.key().as_ref()],
        bump, payer = payer, space = 8 + 32 + 4)]
    pub hashlist: Account<'info, Hashlist>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: can be different from payer for PDA integration
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    #[account(mut)]
    pub group_mint: Signer<'info>,

    #[account(mut)]
    pub group: Signer<'info>,

    #[account()]
    pub system_program: Program<'info, System>,

    /// CHECK: address checked
    #[account(address = spl_token_2022::ID)]
    pub token_program: AccountInfo<'info>,

    /// CHECK: address checked
    #[account(address = group_extension_program::ID)]
    pub group_extension_program: AccountInfo<'info>,
}

pub fn initialise(ctx: Context<InitialiseCtx>, input: InitialiseInput) -> Result<()> {
    if input.symbol.len() > SYMBOL_LIMIT {
        panic!("Symbol too long");
    }
    if input.collection_name.len() > NAME_LIMIT {
        panic!("Name too long");
    }
    if input.collection_uri.len() > URI_LIMIT {
        panic!("Offchain url too long");
    }

    let group_mint = &ctx.accounts.group_mint;

    let group = &ctx.accounts.group;

    let item_uri_is_template = match input.item_base_uri.matches("{}").count() {
        0 => false,
        1 => true,
        _ => {
            panic!("Only one set of curlies ({{}}) can be specified. url had multiple");
        }
    };

    let item_name_is_template = match input.item_base_name.matches("{}").count() {
        0 => false,
        1 => true,
        _ => {
            panic!("Only one set of curlies ({{}}) can be specified. name had multiple");
        }
    };

    ctx.accounts
        .editions_deployment
        .set_inner(EditionsDeployment {
            creator: ctx.accounts.creator.key(),
            max_number_of_tokens: input.max_number_of_tokens,
            number_of_tokens_issued: 0,
            group_mint: group_mint.key(),
            group: group.key(),
            cosigner_program_id: match input.creator_cosign_program_id {
                Some(x) => x,
                _ => system_program::ID,
            },
            symbol: input.symbol,
            item_base_name: input.item_base_name,
            item_base_uri: input.item_base_uri,
            item_name_is_template,
            item_uri_is_template,
            padding: [0; 98],
        });

    let editions_deployment = &ctx.accounts.editions_deployment;
    let payer = &ctx.accounts.payer;
    let group_mint = &ctx.accounts.group_mint;
    let token_program = &ctx.accounts.token_program;
    let group_extension_program = &ctx.accounts.group_extension_program;

    let update_authority =
        OptionalNonZeroPubkey::try_from(Some(editions_deployment.key())).expect("Bad update auth");

    let deployment_seeds: &[&[u8]] = &[
        "editions_deployment".as_bytes(),
        editions_deployment.symbol.as_ref(),
        &[ctx.bumps.editions_deployment],
    ];

    create_token_2022_and_metadata(
        MintAccounts2022 {
            authority: editions_deployment.to_account_info(),
            payer: payer.to_account_info(),
            nft_owner: editions_deployment.to_account_info(),
            nft_mint: group_mint.to_account_info(),
            spl_token_program: token_program.to_account_info(),
        },
        0,
        Some(TokenMetadata {
            name: input.collection_name.clone(),
            symbol: editions_deployment.symbol.clone(),
            uri: input.collection_uri.clone(),
            update_authority,
            mint: group_mint.key(),
            additional_metadata: vec![], // Leave this empty for now,
        }),
        Some(TokenGroupInput {
            group: group.to_account_info(),
            max_size: match editions_deployment.max_number_of_tokens {
                0 => u32::MAX,
                _ => editions_deployment.max_number_of_tokens as u32,
            },
        }),
        None,
        Some(deployment_seeds),
        None,
        Some(group_extension_program.key()),
    )?;

    Ok(())
}
