use anchor_lang::{prelude::*, solana_program::sysvar};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{approve, Approve, Mint, TokenAccount, TokenInterface},
};

// use spl_token_group_interface::state::TokenGroupMember;

use crate::{errors::MarketError, state::*, utils::verify_wns_mint};

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct ListData {
    pub nonce: Pubkey,
    pub payment_mint: Pubkey,
    pub price: u64,
    pub size: u64,
}

#[derive(Accounts)]
#[instruction(data: ListData)]
#[event_cpi]
pub struct ListNft<'info> {
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
        constraint = data.price > 0,
        constraint = data.size > 0,
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
    #[account(
        mint::token_program = nft_token_program
    )]
    pub nft_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = initializer,
        associated_token::token_program = nft_token_program
    )]
    pub initializer_nft_ta: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: checked by constraint and in cpi
    #[account(address = sysvar::instructions::id())]
    pub sysvar_instructions: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: checked by constraint and in cpi
    pub nft_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: checked by constraint and in cpi
    pub nft_program: UncheckedAccount<'info>,
}

impl<'info> ListNft<'info> {
    /*
        Metaplex Delegate Instructions
    */

    /*
        Compressed Delegate Instructions
    */

    /*
        Token 22 Delegate Instructions
    */
    fn token22_nft_delegate(
        &self,
        size: u64,
        remaining_accounts: Vec<AccountInfo<'info>>,
    ) -> Result<()> {
        let delegate_cpi = CpiContext::new(
            self.nft_token_program.to_account_info(),
            Approve {
                to: self.initializer_nft_ta.to_account_info(),
                authority: self.initializer.to_account_info(),
                delegate: self.order.to_account_info(),
            },
        );

        approve(
            delegate_cpi.with_remaining_accounts(remaining_accounts),
            size, // supply = 1
        )
    }
}

#[inline(always)]
pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, ListNft<'info>>,
    data: ListData,
) -> Result<()> {
    msg!("Initialize a new sell order: {}", ctx.accounts.order.key());

    let nft_token_program_key = &ctx.accounts.nft_token_program.key.to_string().clone();
    let nft_program_key = &ctx.accounts.nft_program.key.to_string().clone();
    let remaining_accounts = ctx.remaining_accounts.to_vec();

    let clock = Clock::get()?;
    // create a new order with size 1
    Order::init(
        &mut ctx.accounts.order,
        ctx.accounts.market.key(),
        ctx.accounts.initializer.key(),
        data.nonce,
        ctx.accounts.nft_mint.key(),
        data.payment_mint,
        clock.unix_timestamp,
        OrderSide::Sell.into(),
        data.size, // always 1
        data.price,
        OrderState::Ready.into(),
        true,
    );

    // NFT Transfer
    if *nft_token_program_key == TOKEN_PID {
        // Check if its metaplex or not
        if *nft_program_key == METAPLEX_PID {
            // TODO Delegate Metaplex NFT
            return Err(MarketError::UnsupportedNft.into());
            // ctx.accounts.metaplex_nft_transfer(is_pnft, transfer_params)?;
        } else {
            // Transfer compressed NFT
            // TODO
            return Err(MarketError::UnsupportedNft.into());
        }
    } else if *nft_token_program_key == TOKEN_EXT_PID {
        let mut token22_ra = remaining_accounts.clone();
        if *nft_program_key == WNS_PID {
            let group_member_account = remaining_accounts.get(4).unwrap();

            let (_, extra_remaining_accounts) = remaining_accounts.split_at(7);
            token22_ra = extra_remaining_accounts.to_vec();

            verify_wns_mint(
                ctx.accounts.nft_mint.to_account_info(),
                group_member_account.to_account_info(),
                ctx.accounts.market.market_identifier.clone(),
            )?;
        }
        // Pass in RA for delegate as needed
        ctx.accounts
            .token22_nft_delegate(data.size, token22_ra.clone())?;
    } else if *nft_token_program_key == BUBBLEGUM_PID {
        // Transfer compressed NFT
        // TODO
        return Err(MarketError::UnsupportedNft.into());
    } else {
        // ERROR
        return Err(MarketError::UnsupportedNft.into());
    }

    // Emit event
    emit_cpi!(Order::get_edit_event(
        &mut ctx.accounts.order.clone(),
        ctx.accounts.order.key(),
        ctx.accounts.market.market_identifier,
        OrderEditType::Init,
    ));

    Ok(())
}
