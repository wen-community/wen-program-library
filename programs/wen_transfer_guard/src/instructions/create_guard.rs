use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{mint_to, MintTo, Token2022},
    token_interface::{token_metadata_initialize, Mint, TokenAccount, TokenMetadataInitialize},
};

use crate::{
    tools::update_account_lamports_to_minimum_balance, CpiRule, GuardV1,
    MetadataAdditionalFieldRule, TransferAmountRule, GUARD_V1, WEN_TOKEN_GUARD,
};

#[derive(Accounts)]
#[instruction(args: CreateGuardArgs)]
pub struct CreateGuard<'info> {
    #[account(
        init,
        seeds = [
            WEN_TOKEN_GUARD.as_ref(),
            GUARD_V1.as_ref(),
            mint.key().as_ref()
        ],
        bump,
        payer = payer,
        space = GuardV1::size_of(args.cpi_rule, args.transfer_amount_rule, args.addition_fields_rule),
    )]
    pub guard: Account<'info, GuardV1>,

    #[account(
        init,
        signer,
        payer = payer,
        mint::decimals = 0,
        mint::authority = guard_authority,
        mint::freeze_authority = guard_authority,
        extensions::metadata_pointer::authority = guard_authority,
        extensions::metadata_pointer::metadata_address = mint,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = guard_authority,
        associated_token::token_program = token_program,
    )]
    pub mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    pub guard_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateGuardArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub cpi_rule: Option<CpiRule>,
    pub transfer_amount_rule: Option<TransferAmountRule>,
    pub addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
}

/// IX: create_guard
/// Creates a guard and mints an ownership token to the creator.
pub fn processor(ctx: Context<CreateGuard>, args: CreateGuardArgs) -> Result<()> {
    let guard = &mut ctx.accounts.guard;
    let bump = ctx.bumps.guard;

    msg!("wen_transfer_guard: Initializing guard token metadata");
    /* Initialize token metadata */
    token_metadata_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TokenMetadataInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
                mint_authority: ctx.accounts.guard_authority.to_account_info(),
                update_authority: ctx.accounts.guard_authority.to_account_info(),
            },
        ),
        args.name,
        args.symbol,
        args.uri,
    )?;

    msg!("wen_transfer_guard: Minting guard token to payer");
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.mint_token_account.to_account_info(),
                authority: ctx.accounts.guard_authority.to_account_info(),
            },
        ),
        1,
    )?;

    msg!("wen_transfer_guard: Storing guard data in account");
    guard.set_inner(GuardV1::new(
        ctx.accounts.mint.key(),
        bump,
        args.cpi_rule,
        args.transfer_amount_rule,
        args.addition_fields_rule,
    ));

    msg!("wen_transfer_guard: Updating mint account balance to minimum balance");
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
