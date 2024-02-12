use anchor_lang::{
    prelude::*,
    solana_program::{entrypoint::ProgramResult, program::invoke, system_instruction::transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Transfer},
    token_interface::Token2022,
};

use crate::{Creator, DistributionAccount, DistributionErrors};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreatorShare {
    pub address: Pubkey,
    pub pct: u8,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateDistributionArgs {
    pub amount: u64,
    pub payment_mint: Pubkey,
    pub creators: Vec<CreatorShare>,
}

#[derive(Accounts)]
#[instruction()]
pub struct UpdateDistribution<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub distribution: Account<'info, DistributionAccount>,
    /// CHECK: can be token account or distribution account
    #[account(mut)]
    pub distribution_address: UncheckedAccount<'info>,
    /// CHECK: can be token account or distribution account
    #[account(mut)]
    pub payer_address: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

impl UpdateDistribution<'_> {
    pub fn transfer_royalty_amount(&self, amount: u64) -> ProgramResult {
        let cpi_accounts = Transfer {
            from: self.payer_address.to_account_info(),
            to: self.distribution_address.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn transfer_sol(&self, amount: u64) -> ProgramResult {
        invoke(
            &transfer(
                self.payer_address.key,
                self.distribution_address.key,
                amount,
            ),
            &[
                self.payer_address.to_account_info(),
                self.distribution_address.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )?;
        Ok(())
    }
}

pub fn handler(ctx: Context<UpdateDistribution>, args: UpdateDistributionArgs) -> Result<()> {
    // update creator amounts in distribution account. add creator if not present, else update amount (amount * pct / 100)
    let current_data = ctx.accounts.distribution.data.clone();
    let mut new_data = vec![];
    let mut pct_sum: u8 = 0;
    // Incoming creator updates
    for creator in args.creators.iter() {
        pct_sum += creator.pct;
        let mut creator_found = false;
        for current_creator in current_data.iter() {
            if creator.address == current_creator.address {
                creator_found = true;
                new_data.push(Creator {
                    address: creator.address,
                    amount: current_creator.amount + (args.amount * creator.pct as u64 / 100),
                });
                break;
            }
        }
        if !creator_found {
            new_data.push(Creator {
                address: creator.address,
                amount: args.amount * creator.pct as u64 / 100,
            });
        }
    }
    for orig_creator in current_data.iter() {
        let mut creator_found = false;
        for added_creator in new_data.iter() {
            if orig_creator.address == added_creator.address {
                creator_found = true;
                break;
            }
        }
        if !creator_found {
            new_data.push(Creator {
                address: orig_creator.address,
                amount: orig_creator.amount,
            });
        }
    }
    if pct_sum != 100 {
        return Err(DistributionErrors::InvalidCreatorPctAmount.into());
    }
    ctx.accounts.distribution.data = new_data;

    if args.payment_mint == Pubkey::default() {
        ctx.accounts.transfer_sol(args.amount)?;
    } else {
        ctx.accounts.transfer_royalty_amount(args.amount)?;
    }

    Ok(())
}
