use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022::Token2022};
use wen_new_standard::{
    cpi::{
        accounts::{AddGroup, AddRoyalties, CreateMintAccount},
        add_mint_to_group, add_royalties, create_mint_account,
    },
    program::WenNewStandard,
    CreateMintAccountArgs, UpdateRoyaltiesArgs,
};

#[derive(Accounts)]
pub struct InitializePrepMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub group_update_authority: Signer<'info>,
    #[account(mut)]
    pub mint: Signer<'info>,

    /// CHECK: Created and checked inside WNS program
    #[account(mut)]
    pub mint_token_account: UncheckedAccount<'info>,

    /// CHECK: Can be any account
    pub receiver: AccountInfo<'info>,

    /// CHECK: Checks made inside WNS program
    #[account(mut)]
    pub group: UncheckedAccount<'info>,

    /// CHECK: Checks made inside WNS program
    #[account(mut)]
    pub member: UncheckedAccount<'info>,

    /// CHECK: Checks made inside WNS program
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,

    /// CHECK: Checks made inside WNS program
    #[account(mut)]
    pub manager: UncheckedAccount<'info>,

    /// CHECK: Checks made inside distribution program
    #[account(mut)]
    pub distribution: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub wns_program: Program<'info, WenNewStandard>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePrepMint>, args: InitializePrepMintArgs) -> Result<()> {
    // Init mint account
    create_mint_account(
        CpiContext::new(
            ctx.accounts.wns_program.to_account_info(),
            CreateMintAccount {
                authority: ctx.accounts.authority.to_account_info(),
                manager: ctx.accounts.manager.to_account_info(),
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
        args.mint,
    )?;

    // Add mint to group
    add_mint_to_group(CpiContext::new(
        ctx.accounts.wns_program.to_account_info(),
        AddGroup {
            authority: ctx.accounts.group_update_authority.to_account_info(),
            group: ctx.accounts.group.to_account_info(),
            manager: ctx.accounts.manager.to_account_info(),
            member: ctx.accounts.member.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            payer: ctx.accounts.payer.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    ))?;

    // Add royalties to mint
    add_royalties(
        CpiContext::new(
            ctx.accounts.wns_program.to_account_info(),
            AddRoyalties {
                authority: ctx.accounts.authority.to_account_info(),
                extra_metas_account: ctx.accounts.extra_metas_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        args.royalties,
    )?;

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializePrepMintArgs {
    pub mint: CreateMintAccountArgs,
    pub royalties: UpdateRoyaltiesArgs,
}
