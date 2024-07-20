<<<<<<< Updated upstream
use anchor_lang::{
    solana_program::{
        account_info::AccountInfo, instruction::Instruction, program_error::ProgramError,
        pubkey::Pubkey,
    },
    Result,
=======
use solana_program::{
    account_info::AccountInfo, instruction::Instruction, program_error::ProgramError,
    pubkey::Pubkey, system_instruction::transfer,
>>>>>>> Stashed changes
};
use anchor_spl::{
    associated_token::get_associated_token_address_with_program_id,
    token_2022::spl_token_2022::{
        extension::{BaseStateWithExtensions, StateWithExtensions},
        state::Mint,
    },
    token_interface::spl_token_metadata_interface::state::TokenMetadata,
};
<<<<<<< Updated upstream
use solana_program::system_instruction::transfer;
use spl_associated_token_account::instruction::create_associated_token_account_idempotent;
use spl_token_2022::instruction::transfer_checked;
=======
use spl_token::{solana_program::program_pack::Pack, state::Mint as TokenKegMint};
use spl_token_2022::{
    extension::{BaseStateWithExtensions, StateWithExtensions},
    instruction::transfer_checked,
    state::Mint as Token2022Mint,
};
use spl_token_metadata_interface::state::TokenMetadata;
>>>>>>> Stashed changes
use std::str::FromStr;

pub const ROYALTY_BASIS_POINTS_FIELD: &str = "royalty_basis_points";

pub fn calculate_royalties(
    mint: &AccountInfo,
    amount: u64,
) -> Result<(u64, TokenMetadata), ProgramError> {
    let mint_account_data = mint.try_borrow_data()?;
    let mint_data = StateWithExtensions::<Token2022Mint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;

    // get royalty basis points from metadata Vec(String, String)
    let royalty_basis_points = metadata
        .additional_metadata
        .iter()
        .find(|(key, _)| key == ROYALTY_BASIS_POINTS_FIELD)
        .map(|(_, value)| u64::from_str(value).unwrap())
        .unwrap_or(0);

    Ok((((amount * royalty_basis_points) / 10000), metadata))
}

pub fn generate_royalty_ixs(
    amount: u64,
    mint: &AccountInfo,
    payment_mint: &AccountInfo,
    buyer: &Pubkey,
    token_program_id: &Option<AccountInfo>,
    is_spl: bool,
) -> Result<Vec<Instruction>, ProgramError> {
    let (royalty_amount, metadata) = calculate_royalties(mint, amount)?;

    let creators = metadata
        .additional_metadata
        .iter()
        .filter(|(key, _)| key != ROYALTY_BASIS_POINTS_FIELD)
        .filter_map(|(key, value)| match Pubkey::from_str(key) {
            Ok(pubkey) => Some((pubkey, u8::from_str(value).unwrap_or(0))),
            Err(_) => None,
        })
        .collect::<Vec<(Pubkey, u8)>>();

    let mut instructions = vec![];

    for (creator, creator_share) in creators {
        let creator_share_amount = royalty_amount
            .checked_mul(creator_share.into())
            .and_then(|product| product.checked_div(100))
            .ok_or(ProgramError::ArithmeticOverflow)?;

        let transfer_instruction = if !is_spl {
            transfer(buyer, &creator, creator_share_amount)
        } else {
            let payment_mint_data = payment_mint.try_borrow_data()?;
            let decimals = if payment_mint
                .key
                .to_string()
                .eq(&spl_token::id().to_string())
            {
                let TokenKegMint { decimals, .. } =
                    TokenKegMint::unpack(&payment_mint_data).unwrap();
                decimals
            } else {
                let state_data = StateWithExtensions::<Token2022Mint>::unpack(&payment_mint_data)?;
                state_data.base.decimals
            };

            if token_program_id.is_none() {
                return Err(ProgramError::IncorrectProgramId.into());
            }
            let token_program_id = token_program_id.clone().unwrap().key;
            let source_token_account = get_associated_token_address_with_program_id(
                buyer,
                payment_mint.key,
                token_program_id,
            );
            let destination_token_account = get_associated_token_address_with_program_id(
                &creator,
                payment_mint.key,
                token_program_id,
            );
            instructions.push(create_associated_token_account_idempotent(
                buyer,
                &creator,
                payment_mint.key,
                token_program_id,
            ));

            transfer_checked(
                token_program_id,
                &source_token_account,
                payment_mint.key,
                &destination_token_account,
                buyer,
                &[],
                creator_share_amount,
                decimals,
            )?
        };

        instructions.push(transfer_instruction)
    }

    Ok(instructions)
}
