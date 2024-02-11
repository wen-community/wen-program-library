use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, set_authority,
        spl_token_2022::{extension::ExtensionType, instruction::AuthorityType},
        token_metadata_initialize, Mint, MintTo, SetAuthority, Token2022, TokenAccount,
        TokenMetadataInitialize, TokenMetadataInitializeArgs,
    },
};

use crate::{
    update_mint_lamports_to_minimum_balance, Manager, TokenGroup, GROUP_ACCOUNT_SEED, MANAGER_SEED,
};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateGroupAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub max_size: u32,
}

pub const GROUP_EXTENSIONS: [ExtensionType; 3] = [
    ExtensionType::MetadataPointer,
    ExtensionType::GroupPointer,
    ExtensionType::MintCloseAuthority,
];

#[derive(Accounts)]
#[instruction(args: CreateGroupAccountArgs)]
pub struct CreateGroupAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    /// CHECK: can be any account
    pub authority: UncheckedAccount<'info>,
    #[account()]
    /// CHECK: can be any account
    pub receiver: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [GROUP_ACCOUNT_SEED, mint.key().as_ref()],
        bump,
        payer = payer,
        space = TokenGroup::LEN
    )]
    pub group: Account<'info, TokenGroup>,
    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = manager,
        mint::freeze_authority = authority,
        mint::extensions = GROUP_EXTENSIONS.to_vec(),
        extensions::metadata_pointer::authority = authority.key(),
        extensions::metadata_pointer::metadata_address = mint.key(),
        extensions::group_pointer::authority = authority.key(),
        extensions::group_pointer::group_address = group.key(),
        extensions::close_authority::authority = receiver.key(),
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = payer,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = receiver,
    )]
    pub mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        seeds = [MANAGER_SEED],
        bump
    )]
    pub manager: Account<'info, Manager>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> CreateGroupAccount<'info> {
    fn initialize_metadata(&self, args: TokenMetadataInitializeArgs) -> ProgramResult {
        let cpi_accounts = TokenMetadataInitialize {
            token_program_id: self.token_program.to_account_info(),
            mint: self.mint.to_account_info(),
            metadata: self.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
            mint_authority: self.authority.to_account_info(),
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_initialize(cpi_ctx, args)?;
        Ok(())
    }

    fn mint_to_receiver(&self) -> Result<()> {
        let cpi_ctx = MintTo {
            mint: self.mint.to_account_info(),
            to: self.mint_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        let cpi_accounts = CpiContext::new(self.token_program.to_account_info(), cpi_ctx);
        mint_to(cpi_accounts, 1)?;
        Ok(())
    }

    fn remove_mint_authority(&self) -> Result<()> {
        let cpi_accounts = SetAuthority {
            current_authority: self.authority.to_account_info(),
            account_or_mint: self.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        set_authority(cpi_ctx, AuthorityType::MintTokens, None)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<CreateGroupAccount>, args: CreateGroupAccountArgs) -> Result<()> {
    // initialize token metadata
    ctx.accounts
        .initialize_metadata(TokenMetadataInitializeArgs {
            name: args.name,
            symbol: args.symbol,
            uri: args.uri,
        })?;

    // using a custom group account until token22 implements group account
    let group = &mut ctx.accounts.group;
    group.max_size = args.max_size;
    group.update_authority = ctx.accounts.authority.key();
    group.mint = ctx.accounts.mint.key();
    group.size = 0;

    // mint to receiver
    ctx.accounts.mint_to_receiver()?;

    // remove mint authority
    ctx.accounts.remove_mint_authority()?;

    // update mint lamports to minimum rent balance
    update_mint_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
