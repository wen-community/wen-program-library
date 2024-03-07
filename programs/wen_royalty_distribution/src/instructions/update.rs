use std::str::FromStr;

use anchor_lang::{
    prelude::*,
    solana_program::{entrypoint::ProgramResult, program::invoke, system_instruction::transfer},
};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Transfer},
    token_interface::{
        spl_token_2022::{
            extension::{BaseStateWithExtensions, StateWithExtensions},
            state::Mint as BaseStateMint,
        },
        spl_token_metadata_interface::state::TokenMetadata,
        Mint, Token2022,
    },
};

use crate::{Creator, DistributionAccount, DistributionErrors, ROYALTY_BASIS_POINTS_FIELD};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreatorShare {
    /// creator address
    pub address: Pubkey,
    /// creator share percentage
    pub pct: u8,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateDistributionArgs {
    pub amount: u64,
    pub payment_mint: Pubkey,
}

#[derive(Accounts)]
#[instruction()]
pub struct UpdateDistribution<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mint::token_program = anchor_spl::token_interface::spl_token_2022::id(),
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub distribution_account: Account<'info, DistributionAccount>,
    /// CHECK: can be an initialized token account or an uninitialized token account, checks in cpi
    #[account(mut)]
    pub authority_token_account: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: can be an initialized token account or an uninitialized token account, checks in cpi
    pub distribution_token_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

impl UpdateDistribution<'_> {
    pub fn transfer_royalty_amount(&self, amount: u64) -> ProgramResult {
        let cpi_accounts = Transfer {
            from: self.authority_token_account.to_account_info(),
            to: self.distribution_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn transfer_sol(&self, amount: u64) -> ProgramResult {
        invoke(
            &transfer(self.authority.key, &self.distribution_account.key(), amount),
            &[
                self.authority.to_account_info(),
                self.distribution_account.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )?;
        Ok(())
    }
}

pub fn handler(ctx: Context<UpdateDistribution>, args: UpdateDistributionArgs) -> Result<()> {
    let mint_account = ctx.accounts.mint.to_account_info();
    let mint_account_data = mint_account.try_borrow_data()?;
    let mint_data = StateWithExtensions::<BaseStateMint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;

    // get all creators from metadata Vec(String, String), only royalty_basis_points needs to be removed
    let creators = metadata
        .additional_metadata
        .iter()
        .filter(|(key, _)| key != ROYALTY_BASIS_POINTS_FIELD)
        .filter_map(|(key, value)| match Pubkey::from_str(key) {
            Ok(pubkey) => Some(CreatorShare {
                address: pubkey,
                pct: u8::from_str(value).unwrap(),
            }),
            Err(_) => None,
        })
        .collect::<Vec<CreatorShare>>();

    // update creator amounts in distribution account. add creator if not present, else update amount (amount * pct / 100)
    let current_data = ctx.accounts.distribution_account.claim_data.clone();
    let mut new_data = vec![];
    // Incoming creator updates
    for creator in creators.iter() {
        let mut creator_found = false;
        for current_creator in current_data.iter() {
            if creator.address == current_creator.address {
                creator_found = true;
                new_data.push(Creator {
                    address: creator.address,
                    claim_amount: current_creator
                        .claim_amount
                        .checked_add(
                            (args
                                .amount
                                .checked_mul(creator.pct as u64)
                                .ok_or(DistributionErrors::ArithmeticOverflow)?)
                            .checked_div(100)
                            .ok_or(DistributionErrors::ArithmeticOverflow)?,
                        )
                        .ok_or(DistributionErrors::ArithmeticOverflow)?,
                });
                break;
            }
        }
        if !creator_found {
            new_data.push(Creator {
                address: creator.address,
                claim_amount: (args
                    .amount
                    .checked_mul(creator.pct as u64)
                    .ok_or(DistributionErrors::ArithmeticOverflow)?)
                .checked_div(100)
                .ok_or(DistributionErrors::ArithmeticOverflow)?,
            });
        }
    }

    ctx.accounts.distribution_account.claim_data = new_data;

    if args.payment_mint == Pubkey::default() {
        ctx.accounts.transfer_sol(args.amount)?;
    } else {
        ctx.accounts.transfer_royalty_amount(args.amount)?;
    }

    Ok(())
}
