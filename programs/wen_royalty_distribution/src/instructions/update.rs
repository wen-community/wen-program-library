use std::str::FromStr;

use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke, program_pack::Pack, system_instruction::transfer},
};

use anchor_spl::{
    token::{spl_token::state::Mint as TokenMint, ID as token_keg_program_id},
    token_interface::{
        spl_token_2022::{
            extension::{BaseStateWithExtensions, StateWithExtensions},
            state::Mint as Token2022Mint,
        },
        spl_token_metadata_interface::state::TokenMetadata,
        transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::{
    Creator, DistributionAccount, DistributionErrors, CLAIM_DATA_OFFSET, ROYALTY_BASIS_POINTS_FIELD,
};

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
    /// CHECK: can be Pubkey::default() or mint address
    #[account()]
    pub payment_mint: UncheckedAccount<'info>,
    #[account(
        mut,
        has_one = payment_mint,
        seeds = [distribution_account.group_mint.as_ref(), payment_mint.key().as_ref()],
        bump,
    )]
    pub distribution_account: Account<'info, DistributionAccount>,
    #[account(
        mut,
        token::authority = distribution_account,
        token::mint = payment_mint,
        token::token_program = payment_token_program,
    )]
    pub distribution_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        token::authority = authority,
        token::mint = payment_mint,
        token::token_program = payment_token_program,
    )]
    pub authority_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub payment_token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
}

impl UpdateDistribution<'_> {
    pub fn transfer_royalty_amount(&self, amount: u64) -> Result<()> {
        if self.payment_token_program.is_none() {
            return err!(DistributionErrors::InvalidPaymentTokenProgram);
        }

        let cpi_program = self.payment_token_program.clone().unwrap();

        let mint_data = self.payment_mint.try_borrow_data()?;
        let mint_decimals = if self.token_program.key.eq(&token_keg_program_id) {
            TokenMint::unpack(&mint_data)?.decimals
        } else {
            StateWithExtensions::<Token2022Mint>::unpack(&mint_data)?
                .base
                .decimals
        };

        let authority_token_account = self
            .authority_token_account
            .clone()
            .ok_or(DistributionErrors::InvalidPaymentTokenAccount)?;

        let distribution_token_account = self
            .distribution_token_account
            .clone()
            .ok_or(DistributionErrors::InvalidPaymentTokenAccount)?;

        let cpi_accounts = TransferChecked {
            mint: self.payment_mint.to_account_info(),
            from: authority_token_account.to_account_info(),
            to: distribution_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program.to_account_info(), cpi_accounts);
        transfer_checked(cpi_ctx, amount, mint_decimals)?;
        Ok(())
    }

    pub fn transfer_sol(&self, amount: u64) -> Result<()> {
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
    let mint_data = StateWithExtensions::<Token2022Mint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;
    if args.amount == 0 {
        return Ok(());
    }

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
    let rent = Rent::get()?;
    let current_rent = rent.minimum_balance(
        ctx.accounts
            .distribution_account
            .to_account_info()
            .data_len(),
    );
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

    // add creators from old data with claim amount > 0 if not present in incoming creator updates
    for creator in current_data.iter() {
        if creator.claim_amount > 0 {
            let mut creator_found = false;
            for new_creator in new_data.iter() {
                if creator.address == new_creator.address {
                    creator_found = true;
                    break;
                }
            }
            if !creator_found {
                new_data.push(creator.clone());
            }
        }
    }

    let payment_mint = &ctx.accounts.payment_mint;
    let payment_mint_pubkey = payment_mint.key();

    ctx.accounts.distribution_account.claim_data = new_data.clone();

    let new_creator_size = std::cmp::max(new_data.len() * Creator::INIT_SPACE, Creator::INIT_SPACE);
    let realloc_size = CLAIM_DATA_OFFSET + new_creator_size;

    if payment_mint_pubkey == Pubkey::default() {
        ctx.accounts.transfer_sol(args.amount)?;
    } else {
        ctx.accounts.transfer_royalty_amount(args.amount)?;
        // transfer min rent in or out of distribution account
        let min_rent = rent.minimum_balance(realloc_size);
        if current_rent < min_rent {
            let new_rent = min_rent - current_rent;
            ctx.accounts.transfer_sol(new_rent)?;
        }
    }

    ctx.accounts
        .distribution_account
        .to_account_info()
        .realloc(realloc_size, false)?;



    Ok(())
}
