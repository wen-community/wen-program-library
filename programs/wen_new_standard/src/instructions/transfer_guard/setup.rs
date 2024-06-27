use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{transfer_hook_update, Mint, TransferHookUpdate},
};

use crate::wen_transfer_guard::{self, program::WenTransferGuard};

#[derive(Accounts)]
pub struct SetupTransferGuard<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    pub transfer_hook_authority: Signer<'info>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: Passed as mutable here but it's actually initialized by the transfer guard program
    #[account(
        mut,
        seeds = [wen_transfer_guard::constants::EXTRA_ACCOUNT_METAS.as_ref(), mint.key().as_ref()],
        seeds::program = wen_transfer_guard_program,
        bump,
    )]
    pub extra_metas_account: UncheckedAccount<'info>,

    /// NOTE: Passing seeds here to ease anchor-generated clients.
    #[account(
        seeds = [
            wen_transfer_guard::constants::WEN_TOKEN_GUARD.as_ref(),
            wen_transfer_guard::constants::GUARD_V1.as_ref(),
            guard.mint.as_ref()
        ],
        bump = guard.bump,
        seeds::program = wen_transfer_guard_program
    )]
    pub guard: Account<'info, wen_transfer_guard::accounts::GuardV1>,

    pub wen_transfer_guard_program: Program<'info, WenTransferGuard>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl SetupTransferGuard<'_> {
    fn update_transfer_hook_program_id(&self) -> Result<()> {
        transfer_hook_update(
            CpiContext::new(
                self.token_program.to_account_info(),
                TransferHookUpdate {
                    token_program_id: self.token_program.to_account_info(),
                    mint: self.mint.to_account_info(),
                    authority: self.transfer_hook_authority.to_account_info(),
                },
            ),
            Some(WenTransferGuard::id()),
        )?;
        Ok(())
    }

    fn initialize(&self) -> Result<()> {
        wen_transfer_guard::cpi::initialize(CpiContext::new(
            self.wen_transfer_guard_program.to_account_info(),
            wen_transfer_guard::cpi::accounts::Initialize {
                extra_metas_account: self.extra_metas_account.to_account_info(),
                guard: self.guard.to_account_info(),
                mint: self.mint.to_account_info(),
                payer: self.payer.to_account_info(),
                transfer_hook_authority: self.transfer_hook_authority.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        ))
    }
}

pub fn handler(ctx: Context<SetupTransferGuard>) -> Result<()> {
    ctx.accounts.update_transfer_hook_program_id()?;
    ctx.accounts.initialize()?;
    Ok(())
}
