use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};
use wen_new_standard::{
    cpi::{
        accounts::{CreateGroupAccount, InitManagerAccount},
        create_group_account, init_manager_account,
    },
    program::WenNewStandard,
    CreateGroupAccountArgs,
};
use wen_royalty_distribution::{
    cpi::{accounts::InitializeDistribution, initialize_distribution},
    program::WenRoyaltyDistribution,
};

use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializePrepGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub mint: Signer<'info>,

    /// CHECK: Created and checked inside WNS program
    #[account(mut)]
    pub mint_token_account: UncheckedAccount<'info>,

    /// CHECK: Can be any account
    pub receiver: AccountInfo<'info>,

    #[account(
        init,
        space = Sale::size(),
        payer = payer,
        seeds = [
            TEST_SALE,
            SALE,
            group.key().as_ref(),
            distribution.key().as_ref()
        ],
        bump,
    )]
    pub sale: Account<'info, Sale>,

    /// CHECK: Checks made inside WNS program
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    /// CHECK: Checks made inside WNS program
    #[account(mut)]
    pub manager: UncheckedAccount<'info>,

    /// CHECK: Checks made inside distribution program
    #[account(mut)]
    pub distribution: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub wns_program: Program<'info, WenNewStandard>,
    pub distribution_program: Program<'info, WenRoyaltyDistribution>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePrepGroup>, args: InitializePrepGroupArgs) -> Result<()> {
    let sale = &mut ctx.accounts.sale;

    // Init manager account
    if ctx.accounts.manager.data_is_empty() {
        init_manager_account(CpiContext::new(
            ctx.accounts.wns_program.to_account_info(),
            InitManagerAccount {
                manager: ctx.accounts.manager.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ))?;
    }

    // Init group account
    create_group_account(
        CpiContext::new(
            ctx.accounts.wns_program.to_account_info(),
            CreateGroupAccount {
                authority: ctx.accounts.authority.to_account_info(),
                manager: ctx.accounts.manager.to_account_info(),
                group: ctx.accounts.group.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                receiver: ctx.accounts.receiver.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_token_account: ctx.accounts.mint_token_account.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ),
        args.group,
    )?;

    // Init distribution account
    initialize_distribution(
        CpiContext::new(
            ctx.accounts.distribution_program.to_account_info(),
            InitializeDistribution {
                payer: ctx.accounts.payer.to_account_info(),
                distribution_account: ctx.accounts.distribution.to_account_info(),
                group_mint: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ),
        args.distribution_payment_mint,
    )?;

    sale.bump = ctx.bumps.sale;
    sale.authority = ctx.accounts.authority.key();
    sale.distribution = ctx.accounts.distribution.key();
    sale.group = ctx.accounts.group.key();

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializePrepGroupArgs {
    pub group: CreateGroupAccountArgs,
    pub distribution_payment_mint: Pubkey,
}
