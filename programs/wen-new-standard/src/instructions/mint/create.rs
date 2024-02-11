use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, spl_token_2022::extension::ExtensionType, token_metadata_initialize, Mint, MintTo,
        Token2022, TokenAccount, TokenMetadataInitialize, TokenMetadataInitializeArgs,
    },
};

use crate::{update_mint_lamports_to_minimum_balance, Manager, MANAGER_SEED};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateMintAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub const MINT_EXTENSIONS: [ExtensionType; 4] = [
    ExtensionType::MetadataPointer,
    ExtensionType::GroupMemberPointer,
    ExtensionType::TransferHook,
    ExtensionType::MintCloseAuthority,
];

#[derive(Accounts)]
#[instruction(args: CreateMintAccountArgs)]
pub struct CreateMintAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: can be any account
    pub authority: Signer<'info>,
    #[account()]
    /// CHECK: can be any account
    pub receiver: UncheckedAccount<'info>,
    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = manager,
        mint::freeze_authority = receiver,
        mint::extensions = MINT_EXTENSIONS.to_vec(),
        extensions::metadata_pointer::authority = authority.key(),
        extensions::metadata_pointer::metadata_address = mint.key(),
        extensions::group_member_pointer::authority = authority.key(),
        extensions::transfer_hook::authority = authority.key(),
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

impl<'info> CreateMintAccount<'info> {
    fn initialize_token_metadata(&self, args: TokenMetadataInitializeArgs) -> ProgramResult {
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
}

pub fn handler(ctx: Context<CreateMintAccount>, args: CreateMintAccountArgs) -> Result<()> {
    // initialize token metadata
    ctx.accounts
        .initialize_token_metadata(TokenMetadataInitializeArgs {
            name: args.name,
            symbol: args.symbol,
            uri: args.uri,
        })?;

    // mint to receiver
    ctx.accounts.mint_to_receiver()?;

    // TODO: Once Token Extension program supports Group/Member accounts natively, should lock Mint Authority

    // transfer minimum rent to mint account
    update_mint_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
