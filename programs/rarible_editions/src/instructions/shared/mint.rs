use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, set_authority, MintTo, SetAuthority},
};

use crate::SharedError;
// use libreplex_shared::sysvar_instructions_program;

pub fn mint_non_fungible_2022_logic<'a>(
    non_fungible_mint: &AccountInfo<'a>,
    non_fungible_token_account: &AccountInfo<'a>,
    associated_token_program: &Program<'a, AssociatedToken>,
    payer: &Signer<'a>,
    minter: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    token_program: &UncheckedAccount<'a>,
    authority: &AccountInfo<'a>,
    deployment_seeds: &[&[u8]],
) -> Result<()> {
    msg!("MINT NON-FUNGIBLE {}", token_program.key());
    let expected_token_account =
        anchor_spl::associated_token::get_associated_token_address_with_program_id(
            &minter.key(),
            &non_fungible_mint.key(),
            &token_program.key(),
        );
    if expected_token_account != non_fungible_token_account.key() {
        return Err(SharedError::InvalidTokenAccount.into());
    }
    if non_fungible_token_account.to_account_info().data_is_empty() {
        msg!("{}", payer.key());
        anchor_spl::associated_token::create(CpiContext::new_with_signer(
            associated_token_program.to_account_info(),
            anchor_spl::associated_token::Create {
                payer: payer.to_account_info(),
                associated_token: non_fungible_token_account.to_account_info(),
                authority: minter.clone(),
                mint: non_fungible_mint.clone(),
                system_program: system_program.to_account_info(),
                token_program: token_program.to_account_info(),
            },
            &[deployment_seeds],
        ))?;
    }

    if token_program.key().eq(&spl_token_2022::ID) {
        msg!("Minting {}", token_program.key());
        mint_to(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                MintTo {
                    mint: non_fungible_mint.clone(),
                    to: non_fungible_token_account.to_account_info(),
                    authority: authority.clone(),
                },
                &[deployment_seeds],
            ),
            1,
        )?;
        // no longer removing freeze auth etc as this
        // kills things like escrowless staking. keeping update
        // auth too

        // msg!("Removing freeze auth - non_fungible");

        // set_authority(
        //     CpiContext::new_with_signer(
        //         token_program.to_account_info(),
        //         SetAuthority {
        //             current_authority: authority.clone(),
        //             account_or_mint: non_fungible_mint.clone(),
        //         },
        //         &[deployment_seeds]
        //     ),
        //     anchor_spl::token_2022::spl_token_2022::instruction::AuthorityType::FreezeAccount,
        //     None,
        // )?;

        msg!("Removing mint authority");
        // ok we are at max mint
        set_authority(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                SetAuthority {
                    current_authority: authority.clone(),
                    account_or_mint: non_fungible_mint.clone(),
                },
                &[deployment_seeds],
            ),
            anchor_spl::token_2022::spl_token_2022::instruction::AuthorityType::MintTokens,
            None,
        )?;
        msg!("done");
    } else {
        panic!("This method is only compatible with token-2022")
    }
    Ok(())
}
