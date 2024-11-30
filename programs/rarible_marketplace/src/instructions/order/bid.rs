use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    state::*,
    utils::{
        create_ata, invoke_unwrap_sol, invoke_wrap_sol, UnwrapSolAccounts, WrapSolAccounts,
        WSOL_MINT,
    },
};

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct BidData {
    pub nonce: Pubkey,
    pub price: u64,
    pub size: u64,
}

#[derive(Accounts)]
#[instruction(data: BidData)]
#[event_cpi]
pub struct BidNft<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        constraint = Market::is_active(market.state),
        seeds = [MARKET_SEED,
        market.market_identifier.as_ref()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,
    #[account(
        constraint = data.price > 0 && data.size > 0,
        init,
        seeds = [ORDER_SEED,
        data.nonce.as_ref(),
        market.key().as_ref(),
        initializer.key().as_ref()],
        bump,
        payer = initializer,
        space = 8 + std::mem::size_of::<Order>()
    )]
    pub order: Box<Account<'info, Order>>,
    /// CHECK: create_ata function check
    #[account(mut)]
    pub initializer_payment_ta: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = initializer,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = payment_token_program,
    )]
    pub order_payment_ta: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub payment_mint: Box<InterfaceAccount<'info, Mint>>,
    pub payment_token_program: Interface<'info, TokenInterface>,
    /// CHECK: can be anything
    pub nft_mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> BidNft<'info> {
    fn transfer_payment(&self, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            self.payment_token_program.to_account_info(),
            TransferChecked {
                from: self.initializer_payment_ta.to_account_info(),
                to: self.order_payment_ta.to_account_info(),
                authority: self.initializer.to_account_info(),
                mint: self.payment_mint.to_account_info(),
            },
        );
        transfer_checked(cpi_ctx, amount, self.payment_mint.decimals)
    }

    #[inline(never)]
    fn wrap_sol_if_needed(&self, amount: u64) -> Result<()> {
        if self.payment_mint.key() == WSOL_MINT {
            invoke_wrap_sol(
                &WrapSolAccounts {
                    user: self.initializer.to_account_info(),
                    user_ta: self.initializer_payment_ta.to_account_info(),
                    token_program: self.payment_token_program.to_account_info(),
                    wsol_mint: self.payment_mint.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                amount,
            )?;
        }
        Ok(())
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
pub fn handler(ctx: Context<BidNft>, data: BidData) -> Result<()> {
    msg!("Initialize a new buy order: {}", ctx.accounts.order.key());

    let clock = Clock::get()?;
    let bid_value = data.size.checked_mul(data.price).unwrap();

    create_ata(
        &ctx.accounts.initializer_payment_ta.to_account_info(),
        &ctx.accounts.initializer.to_account_info(),
        &ctx.accounts.payment_mint.to_account_info(),
        &ctx.accounts.initializer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.payment_token_program.to_account_info(),
    )?;

    ctx.accounts.wrap_sol_if_needed(bid_value)?;

    // Transfer bid funds TODO;
    ctx.accounts.transfer_payment(bid_value)?;
    // create a new order with size 1
    Order::init(
        &mut ctx.accounts.order,
        ctx.accounts.market.key(),
        ctx.accounts.initializer.key(),
        data.nonce,
        ctx.accounts.nft_mint.key(),
        ctx.accounts.payment_mint.key(),
        clock.unix_timestamp,
        OrderSide::Buy.into(),
        data.size,
        data.price,
        OrderState::Ready.into(),
        true,
    );

    emit_cpi!(Order::get_edit_event(
        &mut ctx.accounts.order.clone(),
        ctx.accounts.order.key(),
        ctx.accounts.market.market_identifier,
        OrderEditType::Init,
    ));

    ctx.accounts.unwrap_sol_if_needed()?;

    Ok(())
}
