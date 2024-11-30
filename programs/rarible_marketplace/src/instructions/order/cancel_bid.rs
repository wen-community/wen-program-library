use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    state::*,
    utils::{create_ata, get_bump_in_seed_form, invoke_unwrap_sol, UnwrapSolAccounts, WSOL_MINT},
};

#[derive(Accounts)]
#[instruction()]
#[event_cpi]
pub struct CancelBid<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        constraint = order.owner == initializer.key(),
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
        constraint = market.key() == order.market,
        seeds = [MARKET_SEED,
        market.market_identifier.as_ref()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,
    /// CHECK: create_ata function check
    #[account(mut)]
    pub initializer_payment_ta: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = payment_token_program,
    )]
    pub order_payment_ta: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut, constraint = payment_mint.key() == order.payment_mint)]
    pub payment_mint: Box<InterfaceAccount<'info, Mint>>,
    pub payment_token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> CancelBid<'info> {
    fn transfer_payment(&self, signer_seeds: &[&[&[u8]]], amount: u64) -> Result<()> {
        msg!(
            "{:?} -- {:?}",
            amount,
            self.order_payment_ta.key().to_string()
        );
        let cpi_ctx = CpiContext::new_with_signer(
            self.payment_token_program.to_account_info(),
            TransferChecked {
                from: self.order_payment_ta.to_account_info(),
                to: self.initializer_payment_ta.to_account_info(),
                authority: self.order.to_account_info(),
                mint: self.payment_mint.to_account_info(),
            },
            signer_seeds,
        );
        transfer_checked(cpi_ctx, amount, self.payment_mint.decimals)
    }

    #[inline(never)]
    fn unwrap_sol_if_needed(&self) -> Result<()> {
        if self.payment_mint.key() == WSOL_MINT {
            invoke_unwrap_sol(&UnwrapSolAccounts {
                user: self.initializer.to_account_info(),
                user_ta: self.initializer_payment_ta.to_account_info(),
                token_program: self.payment_token_program.to_account_info(),
            })?;
        }
        Ok(())
    }
}

#[inline(always)]
pub fn handler(ctx: Context<CancelBid>) -> Result<()> {
    msg!("Close buy order account: {}", ctx.accounts.order.key());
    ctx.accounts.order.state = OrderState::Closed.into();
    let bump = &get_bump_in_seed_form(&ctx.bumps.order);

    create_ata(
        &ctx.accounts.initializer_payment_ta.to_account_info(),
        &ctx.accounts.initializer.to_account_info(),
        &ctx.accounts.payment_mint.to_account_info(),
        &ctx.accounts.initializer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.payment_token_program.to_account_info(),
    )?;

    let signer_seeds: &[&[&[u8]]; 1] = &[&[
        ORDER_SEED,
        ctx.accounts.order.nonce.as_ref(),
        ctx.accounts.order.market.as_ref(),
        ctx.accounts.order.owner.as_ref(),
        bump,
    ][..]];

    let bid_value = ctx
        .accounts
        .order
        .size
        .checked_mul(ctx.accounts.order.price)
        .unwrap();
    // TODO Transfer funds out
    ctx.accounts.transfer_payment(signer_seeds, bid_value)?;
    emit_cpi!(Order::get_edit_event(
        &mut ctx.accounts.order.clone(),
        ctx.accounts.order.key(),
        ctx.accounts.market.market_identifier,
        OrderEditType::Close,
    ));

    ctx.accounts.unwrap_sol_if_needed()?;
    Ok(())
}
