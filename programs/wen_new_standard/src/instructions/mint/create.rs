use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, set_authority, spl_token_2022::instruction::AuthorityType,
        token_metadata_initialize, Mint, MintTo, SetAuthority, Token2022, TokenAccount,
        TokenMetadataInitialize,
    },
};

use crate::{update_account_lamports_to_minimum_balance, Manager, MANAGER_SEED};

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
    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = manager,
        extensions::metadata_pointer::authority = authority,
        extensions::metadata_pointer::metadata_address = mint,
        extensions::group_member_pointer::authority = manager,
        extensions::transfer_hook::authority = authority,
        extensions::permanent_delegate::delegate = args.permanent_delegate.unwrap_or_else(|| manager.key()),
        // temporary mint close authority until a better program accounts can be used
        extensions::close_authority::authority = manager,
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
