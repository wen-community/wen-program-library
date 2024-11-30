use anchor_lang::{prelude::*, system_program};
use anchor_spl::token_2022_extensions::{token_metadata_update_field, TokenMetadataUpdateField};
use anchor_spl::{associated_token::AssociatedToken, token_2022};
use dyn_fmt::AsStrFormatExt;
use spl_pod::optional_keys::OptionalNonZeroPubkey;
use spl_token_metadata_interface::state::{Field, TokenMetadata};

use crate::shared::{
    create_token_2022_and_metadata, mint_non_fungible_2022_logic, MintAccounts2022, SharedError,
    TokenMemberInput,
};
use crate::utils::{get_mint_metadata, update_account_lamports_to_minimum_balance};
use crate::{errors::EditionsError, group_extension_program, EditionsDeployment};

use super::TokenGroupInput;
#[derive(Accounts)]
pub struct MintCtx<'info> {
    #[account(mut,
        seeds = ["editions_deployment".as_ref(), editions_deployment.symbol.as_ref()], bump)]
    pub editions_deployment: Account<'info, EditionsDeployment>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // when deployment.require_creator_cosign is true, this must be equal to the creator
    // of the deployment otherwise, can be any signer account
    #[account(mut,
        constraint = editions_deployment.cosigner_program_id == system_program::ID || signer.key() == editions_deployment.creator
    )]
    pub signer: Signer<'info>,

    /// CHECK: It's a fair launch. Anybody can sign, anybody can receive the inscription
    #[account(mut)]
    pub minter: UncheckedAccount<'info>,

    /// CHECK: It's a fair launch. Anybody can sign, anybody can receive the inscription

    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub member: Signer<'info>,

    /// CHECK: Checked in constraint
    #[account(mut,
        constraint = editions_deployment.group == group.key())]
    pub group: UncheckedAccount<'info>,

    /// CHECK: Checked in constraint
    #[account(mut,
        constraint = editions_deployment.group_mint == group_mint.key())]
    pub group_mint: UncheckedAccount<'info>,

    /// CHECK: passed in via CPI to mpl_token_metadata program
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,

    /* BOILERPLATE PROGRAM ACCOUNTS */
    /// CHECK: Checked in constraint
    #[account(
        constraint = token_program.key() == token_2022::ID
    )]
    pub token_program: UncheckedAccount<'info>,

    #[account()]
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK: address checked
    #[account(address = group_extension_program::ID)]
    pub group_extension_program: AccountInfo<'info>,

    #[account()]
    pub system_program: Program<'info, System>,
}

pub fn mint<'info>(ctx: Context<'_, '_, '_, 'info, MintCtx<'info>>) -> Result<()> {
    // let MintToken2022Ctx {

    //     ..
    // } = &ctx.accounts;

    let payer = &ctx.accounts.payer;
    let signer = &ctx.accounts.signer;
    let minter = &ctx.accounts.minter;
    let minter_token_account = &ctx.accounts.token_account;
    let token_program = &ctx.accounts.token_program;
    let associated_token_program = &ctx.accounts.associated_token_program;
    let system_program = &ctx.accounts.system_program;
    let mint = &ctx.accounts.mint;
    let member = &ctx.accounts.member;

    let group = &ctx.accounts.group;
    let group_mint = &ctx.accounts.group_mint;
    let group_extension_program = &ctx.accounts.group_extension_program;
    // mutable borrows
    let editions_deployment = &mut ctx.accounts.editions_deployment;

    if !editions_deployment
        .cosigner_program_id
        .eq(&system_program::ID)
        && !signer.key().eq(&editions_deployment.creator.key())
    {
        return Err(SharedError::InvalidCreatorCosigner.into());
    }

    // max_number_of_tokens == 0 means unlimited mints
    if editions_deployment.max_number_of_tokens > 0
        && editions_deployment.number_of_tokens_issued >= editions_deployment.max_number_of_tokens
    {
        return Err(EditionsError::MintedOut.into());
    }

    let update_authority =
        OptionalNonZeroPubkey::try_from(Some(editions_deployment.key())).expect("Bad update auth");

    let deployment_seeds: &[&[u8]] = &[
        "editions_deployment".as_bytes(),
        editions_deployment.symbol.as_ref(),
        &[ctx.bumps.editions_deployment],
    ];

    let item_name = match editions_deployment.item_name_is_template {
        true => editions_deployment
            .item_base_name
            .format(&[editions_deployment.number_of_tokens_issued + 1]),
        false => editions_deployment.item_base_name.clone(),
    };

    let item_url = match editions_deployment.item_uri_is_template {
        true => editions_deployment
            .item_base_uri
            .format(&[editions_deployment.number_of_tokens_issued + 1]),
        false => editions_deployment.item_base_uri.clone(),
    };

    create_token_2022_and_metadata(
        MintAccounts2022 {
            authority: editions_deployment.to_account_info(),
            payer: payer.to_account_info(),
            nft_owner: minter.to_account_info(),
            nft_mint: mint.to_account_info(),
            spl_token_program: token_program.to_account_info(),
        },
        0,
        Some(TokenMetadata {
            name: item_name,
            symbol: editions_deployment.symbol.clone(),
            uri: item_url,
            update_authority,
            mint: mint.key(),
            additional_metadata: vec![],
        }),
        None,
        Some(TokenMemberInput {
            member: member.to_account_info(),
            group: group.to_account_info(),
        }),
        Some(deployment_seeds),
        None,
        Some(group_extension_program.key()),
    )?;

    mint_non_fungible_2022_logic(
        &mint.to_account_info(),
        minter_token_account,
        associated_token_program,
        payer,
        &minter.to_account_info(),
        system_program,
        token_program,
        &editions_deployment.to_account_info(),
        deployment_seeds,
    )?;

    editions_deployment.number_of_tokens_issued += 1;

    // Retrieve metadata from the group mint
    let meta = get_mint_metadata(&mut group_mint.to_account_info())?;
    let additional_meta = meta.additional_metadata;

    // Process each additional metadata key-value pair, excluding platform fee
    for additional_metadatum in additional_meta {
        let deployment_seeds: &[&[u8]] = &[
            "editions_deployment".as_bytes(),
            editions_deployment.symbol.as_ref(),
            &[ctx.bumps.editions_deployment],
        ];
        let signer_seeds: &[&[&[u8]]] = &[deployment_seeds];

        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: token_program.to_account_info(),
            metadata: mint.to_account_info(),
            update_authority: editions_deployment.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token_metadata_update_field(
            cpi_ctx,
            Field::Key(additional_metadatum.0),
            additional_metadatum.1,
        )?;
    }

    // Transfer minimum rent to the mint account
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
