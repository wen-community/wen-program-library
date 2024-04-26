use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{
        mint_to,
        spl_token_2022::{extension::ExtensionType, state::Mint},
        MintTo, Token2022,
    },
    token_interface::{
        spl_pod::optional_keys::OptionalNonZeroPubkey,
        spl_token_metadata_interface::state::TokenMetadata, token_metadata_initialize,
        Mint as IMint, TokenAccount, TokenMetadataInitialize,
    },
};

use wen_new_standard::{CreateMintAccountArgs, UpdateRoyaltiesArgs};

#[derive(Accounts)]
pub struct InitializePrepSPL<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub seller: SystemAccount<'info>,
    pub buyer: SystemAccount<'info>,

    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 6,
        mint::authority = authority,
        mint::freeze_authority = authority,
        extensions::metadata_pointer::authority = authority,
        extensions::metadata_pointer::metadata_address = mint,
    )]
    pub mint: InterfaceAccount<'info, IMint>,

    #[account(
        init,
        payer = payer,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePrepSPL>) -> Result<()> {
    // Init metadata
    let usdc_metadata = TokenMetadata {
        update_authority: OptionalNonZeroPubkey::try_from(Some(ctx.accounts.authority.key()))?,
        mint: ctx.accounts.mint.key(),
        name: "USD Coin".to_string(),
        symbol: "USDC".to_string(),
        uri: "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f45506a465764643541756671535371654d32714e31787a7962617043384734774547476b5a777954447431762f6c6f676f2e706e67".to_string(),
        additional_metadata: vec![],
    };

    let mint_size =
        ExtensionType::try_calculate_account_len::<Mint>(&[ExtensionType::MetadataPointer])?;
    let metadata_size = usdc_metadata.tlv_size_of()?;
    let rent_lamports = Rent::get()?.minimum_balance(mint_size + metadata_size);

    let current_lamports = ctx.accounts.mint.get_lamports();

    if current_lamports < rent_lamports {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.mint.to_account_info(),
                },
            ),
            rent_lamports - current_lamports,
        )?
    }

    token_metadata_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TokenMetadataInitialize {
                metadata: ctx.accounts.mint.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                token_program_id: ctx.accounts.token_program.to_account_info(),
            },
        ),
        usdc_metadata.name,
        usdc_metadata.symbol,
        usdc_metadata.uri,
    )?;

    // Mint USDC to buyer and seller
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
            },
        ),
        10000u64
            .checked_mul(
                10u64
                    .checked_pow(ctx.accounts.mint.decimals.into())
                    .unwrap(),
            )
            .unwrap(),
    )?;

    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
            },
        ),
        10000u64
            .checked_mul(
                10u64
                    .checked_pow(ctx.accounts.mint.decimals.into())
                    .unwrap(),
            )
            .unwrap(),
    )?;

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializePrepSPLArgs {
    pub mint: CreateMintAccountArgs,
    pub royalties: UpdateRoyaltiesArgs,
}
