use anchor_lang::{prelude::*, solana_program};
use anchor_spl::token_interface::{
    spl_token_2022::{
        extension::*,
        instruction::{initialize_permanent_delegate as init_permanent_delegate, *},
    },
    spl_token_metadata_interface::{instruction::*, state::Field},
};

#[derive(Accounts)]
pub struct InitializePermanentDelegate<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_permanent_delegate<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializePermanentDelegate<'info>>,
    delegate: &Pubkey,
) -> Result<()> {
    let ix = init_permanent_delegate(ctx.program.key, ctx.accounts.mint.key, delegate)?;
    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeTransferHook<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_transfer_hook<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeTransferHook<'info>>,
    authority: Option<Pubkey>,
) -> Result<()> {
    let ix = transfer_hook::instruction::initialize(
        &ctx.program.key,
        &ctx.accounts.mint.key,
        authority,
        Some(crate::id()),
    )?;
    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeMintNonTransferrable<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_mint_non_transferable<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeMintNonTransferrable<'info>>,
) -> Result<()> {
    let ix = initialize_non_transferable_mint(ctx.program.key, ctx.accounts.mint.key)?;

    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeInterestBearingMint<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_interest_bearing_mint<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeInterestBearingMint<'info>>,
    rate_authority: Option<Pubkey>,
    rate: i16,
) -> Result<()> {
    let ix = interest_bearing_mint::instruction::initialize(
        ctx.program.key,
        ctx.accounts.mint.key,
        rate_authority,
        rate,
    )?;

    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeMetadataPointer<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_metadata_pointer<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeMetadataPointer<'info>>,
    authority: Option<Pubkey>,
    metadata_address: Option<Pubkey>,
) -> Result<()> {
    let ix = metadata_pointer::instruction::initialize(
        ctx.program.key,
        ctx.accounts.mint.key,
        authority,
        metadata_address,
    )?;

    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeGroupPointer<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_group_pointer<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeGroupPointer<'info>>,
    authority: Option<Pubkey>,
    group_address: Option<Pubkey>,
) -> Result<()> {
    let ix = group_pointer::instruction::initialize(
        ctx.program.key,
        ctx.accounts.mint.key,
        authority,
        group_address,
    )?;

    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeGroupMemberPointer<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_group_member_pointer<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeGroupMemberPointer<'info>>,
    authority: Option<Pubkey>,
    member_address: Option<Pubkey>,
) -> Result<()> {
    let ix = group_member_pointer::instruction::initialize(
        ctx.program.key,
        ctx.accounts.mint.key,
        authority,
        member_address,
    )?;

    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeTransferFeeConfig<'info> {
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
}

pub fn initialize_transfer_fee_config<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeTransferFeeConfig<'info>>,
    transfer_fee_config_authority: Option<&Pubkey>,
    withdraw_withheld_authority: Option<&Pubkey>,
    transfer_fee_basis_points: u16,
    maximum_fee: u64,
) -> Result<()> {
    let ix = transfer_fee::instruction::initialize_transfer_fee_config(
        ctx.program.key,
        ctx.accounts.mint.key,
        transfer_fee_config_authority,
        withdraw_withheld_authority,
        transfer_fee_basis_points,
        maximum_fee,
    )?;

    solana_program::program::invoke(&ix, &[ctx.accounts.mint]).map_err(Into::into)
}

#[derive(Accounts)]
pub struct InitializeMetadata<'info> {
    /// CHECK: CPI Account
    pub metadata: AccountInfo<'info>,
    /// CHECK: CPI Account
    pub update_authority: AccountInfo<'info>,
    /// CHECK: CPI Account
    pub mint: AccountInfo<'info>,
    /// CHECK: CPI Account
    pub mint_authority: AccountInfo<'info>,
}

pub fn intialize_metadata<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, InitializeMetadata<'info>>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let ix = spl_token_metadata_interface::instruction::initialize(
        ctx.program.key,
        ctx.accounts.metadata.key,
        ctx.accounts.update_authority.key,
        ctx.accounts.mint.key,
        ctx.accounts.mint_authority.key,
        name,
        symbol,
        uri,
    );

    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.metadata,
            ctx.accounts.update_authority,
            ctx.accounts.mint,
            ctx.accounts.mint_authority,
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}

#[derive(Accounts)]
pub struct UpdateMetadataField<'info> {
    /// CHECK: CPI Account
    pub metadata: AccountInfo<'info>,
    /// CHECK: CPI Account
    pub update_authority: AccountInfo<'info>,
}

pub fn update_metadata_field<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, UpdateMetadataField<'info>>,
    field: String,
    value: String,
) -> Result<()> {
    let ix = update_field(
        ctx.program.key,
        ctx.accounts.metadata.key,
        ctx.accounts.update_authority.key,
        Field::Key(field),
        value,
    );

    solana_program::program::invoke_signed(
        &ix,
        &[ctx.accounts.metadata, ctx.accounts.update_authority],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}

#[derive(Accounts)]
pub struct RemoveMetadataField<'info> {
    /// CHECK: CPI Account
    pub metadata: AccountInfo<'info>,
    /// CHECK: CPI Account
    pub update_authority: AccountInfo<'info>,
}

pub fn remove_metadata_field<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, RemoveMetadataField<'info>>,
    key: String,
    idempotent: bool,
) -> Result<()> {
    let ix = spl_token_metadata_interface::instruction::remove_key(
        ctx.program.key,
        ctx.accounts.metadata.key,
        ctx.accounts.update_authority.key,
        key,
        idempotent,
    );

    solana_program::program::invoke_signed(
        &ix,
        &[ctx.accounts.metadata, ctx.accounts.update_authority],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}
