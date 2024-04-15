use anchor_lang::{
    prelude::*,
    solana_program::entrypoint::ProgramResult,
    system_program::{create_account, CreateAccount},
};

use anchor_spl::{
    associated_token::{
        create as create_associated_token, get_associated_token_address_with_program_id,
        AssociatedToken, Create as CreateAssociatedToken,
    },
    token_2022::{
        initialize_mint2, initialize_mint_close_authority, spl_token_2022::state::Mint,
        InitializeMint2, InitializeMintCloseAuthority,
    },
    token_interface::{
        mint_to, set_authority,
        spl_token_2022::{extension::*, instruction::AuthorityType},
        spl_token_metadata_interface::state::TokenMetadata,
        token_metadata_initialize, MintTo, SetAuthority, Token2022, TokenMetadataInitialize,
    },
};
use spl_pod::optional_keys::OptionalNonZeroPubkey;

use crate::{token_22_cpi::*, update_account_lamports_to_minimum_balance, Manager, MANAGER_SEED};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateMintAccountArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub permanent_delegate: Option<Pubkey>,
}

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
    #[account(mut)]
    pub mint: Signer<'info>,
    /// CHECK: Checked and created account after mint init
    #[account(mut)]
    pub mint_token_account: UncheckedAccount<'info>,
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
    fn initialize_token_metadata(
        &self,
        name: String,
        symbol: String,
        uri: String,
    ) -> ProgramResult {
        let cpi_accounts = TokenMetadataInitialize {
            token_program_id: self.token_program.to_account_info(),
            mint: self.mint.to_account_info(),
            metadata: self.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
            mint_authority: self.authority.to_account_info(),
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_initialize(cpi_ctx, name, symbol, uri)?;
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

    fn update_mint_authority(&self) -> Result<()> {
        let cpi_accounts = SetAuthority {
            current_authority: self.authority.to_account_info(),
            account_or_mint: self.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        // manager needs to be the new authority so that when solana upgrades to support member accounts, the mint can be updated
        // this will updated to None once solana supports member accounts
        set_authority(cpi_ctx, AuthorityType::MintTokens, Some(self.manager.key()))?;
        Ok(())
    }

    fn set_default_permanent_delegate(&self, bump: u8) -> Result<()> {
        let seeds: &[&[u8]; 2] = &[MANAGER_SEED, &[bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_accounts = SetAuthority {
            current_authority: self.manager.to_account_info(),
            account_or_mint: self.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        set_authority(cpi_ctx, AuthorityType::PermanentDelegate, None)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<CreateMintAccount>, args: CreateMintAccountArgs) -> Result<()> {
    /* Expanding anchor macros */
    let payer = &ctx.accounts.payer;
    let authority = &ctx.accounts.authority;
    let receiver = &ctx.accounts.receiver;
    let mint = &ctx.accounts.mint;
    let manager = &ctx.accounts.manager;
    let mint_token_account = &ctx.accounts.mint_token_account;

    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let associated_token_program = &ctx.accounts.associated_token_program;

    let expected_mint_token_account =
        get_associated_token_address_with_program_id(receiver.key, mint.key, token_program.key);
    require_eq!(expected_mint_token_account, mint_token_account.key());

    let mint_extension_types = vec![
        ExtensionType::MintCloseAuthority,
        ExtensionType::MetadataPointer,
        ExtensionType::GroupMemberPointer,
        ExtensionType::PermanentDelegate,
    ];

    let metadata = TokenMetadata {
        update_authority: OptionalNonZeroPubkey::try_from(Some(authority.key())).unwrap(),
        mint: mint.key(),
        name: args.name.clone(),
        symbol: args.symbol.clone(),
        uri: args.uri.clone(),
        additional_metadata: vec![],
    };

    let mint_size = ExtensionType::try_calculate_account_len::<Mint>(&mint_extension_types)?;
    let metadata_size = metadata.tlv_size_of()?;
    let rent_lamports = Rent::get()?.minimum_balance(mint_size + metadata_size);

    create_account(
        CpiContext::new(
            system_program.to_account_info(),
            CreateAccount {
                from: payer.to_account_info(),
                to: mint.to_account_info(),
            },
        ),
        rent_lamports,
        u64::try_from(mint_size).unwrap(),
        token_program.key,
    )?;

    // temporary close authority untill better program accounts are used
    initialize_mint_close_authority(
        CpiContext::new(
            token_program.to_account_info(),
            InitializeMintCloseAuthority {
                mint: mint.to_account_info(),
            },
        ),
        Some(&manager.key()),
    )?;

    initialize_metadata_pointer(
        CpiContext::new(
            token_program.to_account_info(),
            InitializeMetadataPointer {
                mint: mint.to_account_info(),
            },
        ),
        Some(authority.key()),
        Some(mint.key()),
    )?;

    initialize_group_member_pointer(
        CpiContext::new(
            token_program.to_account_info(),
            InitializeGroupMemberPointer {
                mint: mint.to_account_info(),
            },
        ),
        Some(manager.key()),
        Some(mint.key()),
    )?;

    initialize_permanent_delegate(
        CpiContext::new(
            token_program.to_account_info(),
            InitializePermanentDelegate {
                mint: mint.to_account_info(),
            },
        ),
        &args.permanent_delegate.unwrap_or(manager.key()),
    )?;

    initialize_mint2(
        CpiContext::new(
            token_program.to_account_info(),
            InitializeMint2 {
                mint: mint.to_account_info(),
            },
        ),
        0,
        &authority.key(),
        Some(&manager.key()),
    )?;

    create_associated_token(CpiContext::new(
        associated_token_program.to_account_info(),
        CreateAssociatedToken {
            payer: payer.to_account_info(),
            associated_token: mint_token_account.to_account_info(),
            authority: receiver.to_account_info(),
            mint: mint.to_account_info(),
            system_program: system_program.to_account_info(),
            token_program: token_program.to_account_info(),
        },
    ))?;
    /* */

    if args.permanent_delegate.is_none() {
        ctx.accounts
            .set_default_permanent_delegate(ctx.bumps.manager)?;
    }

    // initialize token metadata
    ctx.accounts
        .initialize_token_metadata(args.name, args.symbol, args.uri)?;

    // mint to receiver
    ctx.accounts.mint_to_receiver()?;

    // remove mint authority
    ctx.accounts.update_mint_authority()?;
    // TODO: Once Token Extension program supports Group/Member accounts natively, should lock Mint Authority

    // transfer minimum rent to mint account
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
