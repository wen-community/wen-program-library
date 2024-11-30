/// Accounts to mint an NFT.
use anchor_lang::prelude::*;

use solana_program::{
    program::{invoke, invoke_signed},
    system_instruction,
};

use spl_token_2022::{
    extension::{group_pointer::GroupPointer, transfer_fee::TransferFeeConfig, ExtensionType},
    instruction::initialize_mint2,
    state::Mint,
};

use spl_token_group_interface::{
    instruction::{initialize_group, initialize_member},
    state::{TokenGroup, TokenGroupMember},
};
use spl_token_metadata_interface::{instruction::initialize, state::TokenMetadata};
use spl_type_length_value::state::{TlvState, TlvStateBorrowed};

/// Accounts to mint an NFT.
pub struct MintAccounts2022<'info> {
    pub authority: AccountInfo<'info>,
    pub payer: AccountInfo<'info>,
    pub nft_owner: AccountInfo<'info>,
    pub nft_mint: AccountInfo<'info>,
    pub spl_token_program: AccountInfo<'info>,
}

pub struct TokenGroupInput<'f> {
    pub max_size: u32,
    pub group: AccountInfo<'f>,
}

pub struct TokenMemberInput<'f> {
    pub group: AccountInfo<'f>,
    pub member: AccountInfo<'f>,
}

pub struct TransferFeeParams {
    pub transfer_fee_bps: u16,
    pub withdraw_fee_authority: Pubkey,
}

/// Creates the metadata accounts and mint a new token.
pub fn create_token_2022_and_metadata<'a>(
    accounts: MintAccounts2022<'a>,
    decimals: u8,
    token_metadata: Option<TokenMetadata>,
    // token group is optional - specifying this turns this into a group mint
    token_group: Option<TokenGroupInput<'a>>,
    token_member: Option<TokenMemberInput<'a>>,
    auth_seeds: Option<&[&[u8]]>,
    transfer_fee_params: Option<TransferFeeParams>,
    token_group_program_id: Option<Pubkey>,
) -> Result<()> {
    // msg!("create_token_2022_and_metadata called");
    let MintAccounts2022 {
        payer,
        nft_mint,
        spl_token_program,
        nft_owner,
        authority,
        ..
    } = accounts;

    let rent = Rent::get()?;

    let mut extension_types = vec![];

    let mut extension_extra_space: usize = 0;

    match &token_metadata {
        Some(x) => {
            extension_types.push(ExtensionType::MetadataPointer);
            extension_extra_space += x.tlv_size_of().unwrap();
        }
        None => {}
    };

    match &token_group {
        Some(_) => {
            extension_types.push(ExtensionType::GroupPointer);
            // extension_types.push(ExtensionType::TokenGroup);
            extension_extra_space += std::mem::size_of::<GroupPointer>()
                // + std::mem::size_of::<TokenGroup>()
                + TlvStateBorrowed::get_base_len();

            extension_extra_space +=
                std::mem::size_of::<TokenGroup>() + TlvStateBorrowed::get_base_len();
        }
        None => {}
    };

    if let Some(x) = &transfer_fee_params {
        if x.transfer_fee_bps > 0 {
            extension_types.push(ExtensionType::TransferFeeConfig);
            extension_extra_space += std::mem::size_of::<TransferFeeConfig>()
        }
    }

    match &token_member {
        Some(_) => {
            extension_types.push(ExtensionType::GroupMemberPointer);
            extension_extra_space +=
                std::mem::size_of::<TokenGroupMember>() + TlvStateBorrowed::get_base_len();
        }
        None => {}
    };

    let base_size = ExtensionType::try_calculate_account_len::<Mint>(&extension_types).unwrap();

    let rent_lamports = rent.minimum_balance(base_size + extension_extra_space);

    let create_account_ix = system_instruction::create_account(
        &payer.key(),
        &nft_mint.key(),
        rent_lamports,
        (base_size).try_into().unwrap(),
        &spl_token_2022::ID, // &token_group_program_id.unwrap() //,
    );

    msg!("Invoke create account {},{}", payer.key(), nft_mint.key());

    invoke(
        &create_account_ix,
        &[
            nft_mint.to_account_info(),
            payer.to_account_info(),
            spl_token_program.to_account_info(),
        ],
    )?;

    if token_metadata.is_some() {
        let initialize_extension =
            spl_token_2022::extension::metadata_pointer::instruction::initialize(
                &spl_token_2022::ID,
                &nft_mint.key(),
                Some(authority.key()),
                // we are using the native metadata implementation,
                // hence setting metadata address = mint address
                Some(nft_mint.key()),
            )
            .unwrap();

        msg!("Invoke initialise metadata pointer extension");

        match auth_seeds {
            Some(x) => {
                invoke_signed(
                    &initialize_extension,
                    &[authority.to_account_info(), nft_mint.to_account_info()],
                    &[x],
                )?;
            }
            None => {
                invoke(
                    &initialize_extension,
                    &[authority.to_account_info(), nft_mint.to_account_info()],
                )?;
            }
        }
    }

    if let Some(tfp) = &transfer_fee_params {
        if tfp.transfer_fee_bps > 0 {
            let initialise_transfer_fee_extension =
            spl_token_2022::extension::transfer_fee::instruction::initialize_transfer_fee_config(
                &spl_token_2022::ID,
                &nft_mint.key(),
                Some(&authority.key()),
                Some(&tfp.withdraw_fee_authority),
                tfp.transfer_fee_bps,
                std::u64::MAX,
            )?;
            match &auth_seeds {
                Some(y) => {
                    invoke_signed(
                        &initialise_transfer_fee_extension,
                        &[
                            nft_mint.to_account_info(),
                            authority.to_account_info(),
                            nft_mint.to_account_info(),
                        ],
                        &[y],
                    )?;
                }
                None => {
                    invoke(
                        &initialise_transfer_fee_extension,
                        &[
                            nft_mint.to_account_info(),
                            authority.to_account_info(),
                            nft_mint.to_account_info(),
                        ],
                    )?;
                }
            }
        }
    }

    match &token_group {
        Some(_x) => {
            let initialize_extension =
                spl_token_2022::extension::group_pointer::instruction::initialize(
                    &spl_token_2022::ID,
                    &nft_mint.key(),
                    Some(authority.key()),
                    Some(nft_mint.key()),
                )
                .unwrap();
            match &auth_seeds {
                Some(y) => {
                    invoke_signed(
                        &initialize_extension,
                        &[
                            nft_mint.to_account_info(),
                            authority.to_account_info(),
                            nft_mint.to_account_info(),
                        ],
                        &[y],
                    )?;
                }
                None => {
                    invoke(
                        &initialize_extension,
                        &[
                            nft_mint.to_account_info(),
                            authority.to_account_info(),
                            nft_mint.to_account_info(),
                        ],
                    )?;
                }
            }
        }
        None => {}
    }

    match &token_member {
        Some(x) => {
            let initialize_extension =
                spl_token_2022::extension::group_member_pointer::instruction::initialize(
                    &spl_token_2022::ID,
                    &nft_mint.key(),
                    Some(authority.key()),
                    Some(x.group.key()),
                )
                .unwrap();
            match &auth_seeds {
                Some(y) => {
                    invoke_signed(
                        &initialize_extension,
                        &[
                            nft_mint.to_account_info(),
                            authority.to_account_info(),
                            x.group.to_account_info(),
                        ],
                        &[y],
                    )?;
                }
                None => {
                    invoke(
                        &initialize_extension,
                        &[
                            nft_mint.to_account_info(),
                            authority.to_account_info(),
                            x.group.to_account_info(),
                        ],
                    )?;
                }
            }
        }
        None => {}
    }
    msg!("Invoke initialise mint");

    let initialize_ix = initialize_mint2(
        &spl_token_2022::ID,
        &nft_mint.key(),
        &authority.key(),
        Some(&authority.key()),
        decimals,
    )
    .unwrap();

    // msg!("Invoke initialise mint2");
    invoke(&initialize_ix, &[nft_mint.to_account_info()])?;

    // to be enabled when groups have been audited and rolled out

    msg!("Initialise metadata if needed");
    if let Some(x) = token_metadata {
        let initialise_metadata_ix = initialize(
            &spl_token_2022::ID,
            &nft_mint.key(),
            &authority.key(),
            &nft_mint.key(),
            &authority.key(),
            x.name.clone(),
            x.symbol.clone(),
            x.uri.clone(),
        );

        let account_infos = &[
            nft_mint.to_account_info(),
            authority.to_account_info(),
            nft_mint.to_account_info(),
            nft_owner.to_account_info(),
        ];
        match auth_seeds {
            Some(x) => {
                invoke_signed(&initialise_metadata_ix, account_infos, &[x])?;
            }
            None => {
                invoke(&initialise_metadata_ix, account_infos)?;
            }
        }
    }

    if let Some(program_id) = token_group_program_id {
        match &token_group {
            Some(x) => {
                let space = TlvStateBorrowed::get_base_len() + std::mem::size_of::<TokenGroup>();
                let rent_lamports = rent.minimum_balance(space);

                let create_group_account_ix = system_instruction::create_account(
                    &payer.key(),
                    &x.group.key(),
                    rent_lamports,
                    (space).try_into().unwrap(),
                    &program_id, // &token_group_program_id.unwrap() //,
                );

                msg!("Invoke create account {},{}", payer.key(), nft_mint.key());

                invoke(
                    &create_group_account_ix,
                    &[
                        x.group.to_account_info(),
                        payer.to_account_info(),
                        spl_token_program.to_account_info(),
                    ],
                )?;
                match &auth_seeds {
                    Some(y) => {
                        msg!("Initialise group");

                        invoke_signed(
                            &initialize_group(
                                &program_id, //&nft_mint.key(),
                                &x.group.key(),
                                &nft_mint.key(),
                                &authority.key(),
                                Some(authority.key()),
                                x.max_size,
                            ),
                            &[
                                nft_mint.to_account_info(),
                                x.group.to_account_info(),
                                nft_mint.to_account_info(),
                                authority.to_account_info(),
                            ],
                            &[y],
                        )?;
                        msg!("Group initialised");
                    }
                    None => {
                        invoke(
                            &initialize_group(
                                &program_id,
                                &nft_mint.key(),
                                &nft_mint.key(),
                                &authority.key(),
                                // Pubkey::new_unique().into(),
                                Some(authority.key()),
                                x.max_size,
                            ),
                            &[nft_mint.to_account_info(), authority.to_account_info()],
                        )?;
                    }
                }
            }
            None => {}
        }
    }

    // to be enabled when groups have been audited and rolled out
    if let Some(program_id) = token_group_program_id {
        match &token_member {
            Some(x) => {
                let member_space =
                    TlvStateBorrowed::get_base_len() + std::mem::size_of::<TokenGroupMember>();
                let member_rent_lamports = rent.minimum_balance(member_space);

                let create_member_account_ix = system_instruction::create_account(
                    &payer.key(),
                    &x.member.key(),
                    member_rent_lamports,
                    (member_space).try_into().unwrap(),
                    &program_id, // &token_group_program_id.unwrap() //,
                );

                msg!("Invoke create account {},{}", payer.key(), nft_mint.key());

                invoke(
                    &create_member_account_ix,
                    &[
                        x.member.to_account_info(),
                        payer.to_account_info(),
                        spl_token_program.to_account_info(),
                    ],
                )?;

                let initialize_member_ix = initialize_member(
                    &program_id,
                    &x.member.key(),
                    &nft_mint.key(),
                    &authority.key(),
                    &x.group.key(),
                    &authority.key(),
                );

                let initialize_member_account_infos = [
                    nft_mint,
                    x.member.clone(),
                    x.group.clone(),
                    authority.to_account_info(),
                ];
                match &auth_seeds {
                    Some(y) => {
                        invoke_signed(
                            &initialize_member_ix,
                            &initialize_member_account_infos,
                            &[y],
                        )?;
                    }
                    None => {
                        invoke(&initialize_member_ix, &initialize_member_account_infos)?;
                    }
                }
            }
            None => {}
        }
    }

    msg!("Finished");
    Ok(())
}
