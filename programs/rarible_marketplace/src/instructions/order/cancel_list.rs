use anchor_lang::prelude::*;
use anchor_lang::{solana_program::sysvar, Key};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{revoke, Mint, Revoke, TokenAccount, TokenInterface};

use crate::errors::MarketError;
use crate::state::*;
use crate::utils::get_bump_in_seed_form;

#[derive(Accounts)]
#[instruction()]
#[event_cpi]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        constraint = order.owner == initializer.key(),
        constraint = order.market == market.key(),
        constraint = Order::is_active(order.state),
        seeds = [ORDER_SEED,
        order.nonce.as_ref(),
        order.market.as_ref(),
        initializer.key().as_ref()],
        bump,
        close = initializer,
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        constraint = Market::is_active(market.state),
        seeds = [MARKET_SEED,
        market.market_identifier.as_ref()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(mut)]
    pub nft_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        constraint = initializer_nft_ta.owner == initializer.key(),
        constraint = initializer_nft_ta.mint == nft_mint.key(),
    )]
    pub initializer_nft_ta: Box<InterfaceAccount<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    /// CHECK: checked by constraint and in cpi
    #[account(address = sysvar::instructions::id())]
    pub sysvar_instructions: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: checked by constraint and in cpi
    pub nft_token_program: Interface<'info, TokenInterface>,
    /// CHECK: checked by constraint and in cpi
    pub nft_program: UncheckedAccount<'info>,
}

impl<'info> CancelListing<'info> {
    /*
        Metaplex Transfer Instructions
    */

    /*
        Compressed Transfer Instructions
    */

    /*
        Token 22 Transfer Instructions
    */
    fn token22_nft_revoke(
        &self,
        signer_seeds: &[&[&[u8]]],
        remaining_accounts: Vec<AccountInfo<'info>>,
    ) -> Result<()> {
        let cpi_ctx = CpiContext::new_with_signer(
            self.nft_token_program.to_account_info(),
            Revoke {
                authority: self.order.to_account_info(),
                source: self.initializer_nft_ta.to_account_info(),
            },
            signer_seeds,
        );
        revoke(cpi_ctx.with_remaining_accounts(remaining_accounts))
    }
}

#[inline(always)]
pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, CancelListing<'info>>) -> Result<()> {
    msg!("Close sell order account: {}", ctx.accounts.order.key());
    let nft_token_program_key = &ctx.accounts.nft_token_program.key.to_string().clone();
    let nft_program_key = &ctx.accounts.nft_program.key.to_string().clone();
    let remaining_accounts = ctx.remaining_accounts.to_vec();

    let bump = &get_bump_in_seed_form(&ctx.bumps.order);
    let signer_seeds: &[&[&[u8]]; 1] = &[&[
        ORDER_SEED,
        ctx.accounts.order.nonce.as_ref(),
        ctx.accounts.order.market.as_ref(),
        ctx.accounts.order.owner.as_ref(),
        bump,
    ][..]];

    // NFT Transfer
    if *nft_token_program_key == TOKEN_PID {
        // Check if its metaplex or not
        if *nft_program_key == METAPLEX_PID {
            // TODO
            return Err(MarketError::UnsupportedNft.into());
        } else {
            // Transfer compressed NFT
            // TODO
            return Err(MarketError::UnsupportedNft.into());
        }
    } else if *nft_token_program_key == TOKEN_EXT_PID {
        let token22_ra = remaining_accounts.clone();
        ctx.accounts.token22_nft_revoke(signer_seeds, token22_ra)?;
    } else if *nft_token_program_key == BUBBLEGUM_PID {
        // Transfer compressed NFT
        // TODO
        return Err(MarketError::UnsupportedNft.into());
    } else {
        // ERROR
        return Err(MarketError::UnsupportedNft.into());
    }

    ctx.accounts.order.state = OrderState::Closed.into();

    emit_cpi!(Order::get_edit_event(
        &mut ctx.accounts.order.clone(),
        ctx.accounts.order.key(),
        ctx.accounts.market.market_identifier,
        OrderEditType::Close,
    ));
    Ok(())
}
