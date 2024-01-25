use anchor_lang::{
    prelude::*,
    solana_program::{entrypoint::ProgramResult, program::invoke, system_instruction::transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, set_authority,
        spl_token_2022::{extension::ExtensionType, instruction::AuthorityType},
        token_metadata_initialize,
        MetadataPointerInitializeArgs, Mint, MintTo, SetAuthority, Token2022, TokenAccount,
        TokenMetadataInitialize,
        TokenMetadataInitializeArgs,
    },
};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct MintArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub nonce: Pubkey,
}

pub const MINT_EXTENSIONS: [ExtensionType; 1] =
    [ExtensionType::MetadataPointer];

#[derive(Accounts)]
#[instruction(args: MintArgs)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account()]
    /// CHECK: can be any account
    pub receiver: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [args.nonce.as_ref()],
        bump,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
        mint::extensions = MINT_EXTENSIONS.to_vec(),
        mint::metadata_pointer_data = MetadataPointerInitializeArgs {
            authority: Some(authority.key()),
            metadata_address: Some(mint.key())
        }
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = payer,
        associated_token::token_program = token_program,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> MintNft<'info> {
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

    fn fund_nft_mint(&self, amount: u64) -> Result<()> {
        invoke(
            &transfer(self.payer.key, &self.mint.key(), amount),
            &[
                self.payer.to_account_info(),
                self.mint.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )
        .map_err(Into::into)
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

pub fn handler(
    ctx: Context<MintNft>,
    args: MintArgs,
) -> Result<()> {

    // Initialize token metadata in Token 2022 extension.
    ctx.accounts
        .initialize_token_metadata(TokenMetadataInitializeArgs {
            name: args.name,
            symbol: args.symbol,
            uri: args.uri,
        })?;


    // Payer funds mint account
    let lamports = Rent::get()?.minimum_balance(ctx.accounts.mint.to_account_info().data_len())
        - ctx.accounts.mint.get_lamports();

    ctx.accounts.fund_nft_mint(lamports)?;

    // Mint NFT to receiver
    ctx.accounts.mint_to_receiver()?;

    // Restrict ability to mint
    ctx.accounts.remove_mint_authority()?;

    Ok(())
}
