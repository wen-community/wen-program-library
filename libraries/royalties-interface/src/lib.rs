use solana_sdk::{
    account_info::AccountInfo, instruction::Instruction, program_error::ProgramError,
    pubkey::Pubkey, system_instruction::transfer,
};
use spl_associated_token_account::{
    get_associated_token_address_with_program_id,
    instruction::create_associated_token_account_idempotent,
};
use spl_token_2022::{
    extension::{BaseStateWithExtensions, StateWithExtensions},
    instruction::transfer_checked,
    state::Mint,
};
use spl_token_metadata_interface::state::TokenMetadata;
use std::str::FromStr;

pub const ROYALTY_BASIS_POINTS_FIELD: &str = "royalty_basis_points";

pub fn calculate_royalties(
    mint: &AccountInfo,
    amount: u64,
) -> Result<(u64, TokenMetadata, Mint), ProgramError> {
    let mint_account_data = mint.try_borrow_data()?;
    let mint_data = StateWithExtensions::<Mint>::unpack(&mint_account_data)?;
    let metadata = mint_data.get_variable_len_extension::<TokenMetadata>()?;

    // get royalty basis points from metadata Vec(String, String)
    let royalty_basis_points = metadata
        .additional_metadata
        .iter()
        .find(|(key, _)| key == ROYALTY_BASIS_POINTS_FIELD)
        .map(|(_, value)| u64::from_str(value).unwrap())
        .unwrap_or(0);

    Ok((
        ((amount * royalty_basis_points) / 10000),
        metadata,
        mint_data.base,
    ))
}

pub fn generate_royalty_ixs(
    amount: u64,
    mint: &AccountInfo,
    buyer: &Pubkey,
    token_program_id: &Option<AccountInfo>,
    is_spl: bool,
) -> Result<Vec<Instruction>, ProgramError> {
    let (royalty_amount, metadata, mint_base_state) = calculate_royalties(mint, amount)?;

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
            if token_program_id.is_none() {
                return Err(ProgramError::IncorrectProgramId);
            }
            let token_program_id = token_program_id.clone().unwrap().key;
            let source_token_account =
                get_associated_token_address_with_program_id(buyer, mint.key, token_program_id);
            let destination_token_account =
                get_associated_token_address_with_program_id(&creator, mint.key, token_program_id);
            instructions.push(create_associated_token_account_idempotent(
                buyer,
                &destination_token_account,
                mint.key,
                token_program_id,
            ));

            transfer_checked(
                token_program_id,
                &source_token_account,
                mint.key,
                &destination_token_account,
                buyer,
                &[],
                amount,
                mint_base_state.decimals,
            )?
        };

        instructions.push(transfer_instruction)
    }

    Ok(instructions)
}
