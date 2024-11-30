use anchor_lang::{
    prelude::{msg, AccountInfo, Pubkey, Result},
    pubkey, require,
    solana_program::{
        program::{invoke, invoke_signed},
        system_instruction::transfer,
    },
    ToAccountInfo,
};
use anchor_spl::associated_token::{get_associated_token_address, spl_associated_token_account};
use anchor_spl::token::spl_token;
use mpl_token_metadata::accounts::Metadata;
use mpl_token_metadata::types::{AuthorizationData, TokenStandard};

use crate::errors::MarketError;

use super::metaplex::pnft::utils::{ExistingDelegateParams, PnftParams};
use spl_associated_token_account::instruction::create_associated_token_account;

pub fn get_bump_in_seed_form(bump: &u8) -> [u8; 1] {
    let bump_val = *bump;
    [bump_val]
}

#[inline(always)]
pub fn lamport_transfer<'info>(
    src: AccountInfo<'info>,
    dest: AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    **dest.lamports.borrow_mut() = dest
        .lamports()
        .checked_add(amount)
        .ok_or(MarketError::AmountOverflow)?;
    **src.lamports.borrow_mut() = src
        .lamports()
        .checked_sub(amount)
        .ok_or(MarketError::AmountUnderflow)?;
    Ok(())
}

/// return if nft is pnft
#[inline(always)]
pub fn get_is_metaplex_nft(nft_account_info: &AccountInfo) -> bool {
    let metadata_res = Metadata::safe_deserialize(&nft_account_info.data.borrow()[..]);
    if let Ok(metadata) = metadata_res {
        if let Some(standard) = &metadata.token_standard {
            if *standard == TokenStandard::Fungible {
                return false;
            }
        }
        true
    } else {
        false
    }
}

fn get_pnft_params(ra: Vec<AccountInfo>) -> PnftParams {
    let fourth_account = ra.get(3).cloned().unwrap();
    let dest_token_record = if *fourth_account.key == Pubkey::default() {
        None
    } else {
        Some(fourth_account)
    };

    PnftParams {
        owner_token_record: ra.first().cloned(),
        authorization_rules: ra.get(1).cloned(),
        authorization_rules_program: ra.get(2).cloned(),
        destination_token_record: dest_token_record,
        authorization_data: None,
    }
}

/// transfer sol
/// amount in lamports
pub fn transfer_sol<'info>(
    from_account: AccountInfo<'info>,
    to_account: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    signer_seeds: Option<&[&[&[u8]]; 1]>,
    amount: u64,
) -> Result<()> {
    if let Some(seeds) = signer_seeds {
        invoke_signed(
            &transfer(from_account.key, to_account.key, amount),
            &[
                from_account.to_account_info(),
                to_account.to_account_info(),
                system_program.to_account_info(),
            ],
            seeds,
        )
        .map_err(Into::into)
    } else {
        invoke(
            &transfer(from_account.key, to_account.key, amount),
            &[
                from_account.to_account_info(),
                to_account.to_account_info(),
                system_program.to_account_info(),
            ],
        )
        .map_err(Into::into)
    }
}

/// result of parsing remaining accounts
pub struct ParsedRemainingAccounts<'info> {
    //params for pnft ix's
    pub pnft_params: PnftParams<'info>,
    // delegate record if we're freezing/unfreezing
    pub delegate_record: Option<AccountInfo<'info>>,
    // params for removing existing delegExtraDelegateParams
    pub existing_delegate_params: Option<ExistingDelegateParams<'info>>,
    pub creator_token_accounts: Vec<AccountInfo<'info>>,
}

fn parse_pnft_accounts(remaining_accounts: Vec<AccountInfo>) -> PnftParams {
    let account_0 = remaining_accounts.first().unwrap();

    if account_0.key == &Pubkey::default() {
        PnftParams {
            authorization_data: None,
            authorization_rules: None,
            authorization_rules_program: None,
            owner_token_record: None,
            destination_token_record: None,
        }
    } else {
        get_pnft_params(remaining_accounts)
    }
}

fn parse_existing_delegate_accounts(
    remaining_accounts: Vec<AccountInfo>,
) -> Option<ExistingDelegateParams> {
    let account_0 = remaining_accounts.first().unwrap();

    if account_0.key == &Pubkey::default() {
        None
    } else {
        Some(ExistingDelegateParams {
            existing_delegate: remaining_accounts.first().cloned().unwrap(),
            existing_delegate_record: remaining_accounts.get(1).cloned().unwrap(),
        })
    }
}

fn parse_delegate_record(remaining_accounts: Vec<AccountInfo>) -> Option<AccountInfo> {
    let account_0 = remaining_accounts.first().cloned().unwrap();

    if account_0.key == &Pubkey::default() {
        None
    } else {
        Some(account_0)
    }
}

/*
REMAINING ACCOUNTS:
    0: NFT Token Program (Token, Token22)
    1: NFT Program (Token Metadata, WNS) - Leave as default pubkey if no program
    - Normal NFT
        2: Edition Account
        3: NFT Metadata Account
    - pNFT
        2: Edition Account
        3: NFT Metadata Account
        4: owner_token_record: Option<AccountInfo> = accounts.get(0).cloned();
        5: dest_token_record: Option<AccountInfo> = accounts.get(1).cloned();
        6: rules_acc: Option<AccountInfo> = accounts.get(2).cloned();
        7: authorization_rules_program: Option<AccountInfo> = accounts.get(3).cloned();
    - WNS NFT
        2: Approve Account
        3: Extra Metas Account
        4: Distribution Account
        5: Distribution Program
    - Compressed NFT
        2: Tree Config Account
        3: Log Wrapper Account
        4: Compression Program
        5: MPL Bubblegum Program
*/

pub struct MetaplexTransferParams<'a> {
    pub nft_metadata: Option<AccountInfo<'a>>,
    pub nft_edition: Option<AccountInfo<'a>>,
    pub owner_token_record: Option<AccountInfo<'a>>,
    pub dest_token_record: Option<AccountInfo<'a>>,
    pub authorization_rules: Option<AccountInfo<'a>>,
    pub authorization_data: Option<AuthorizationData>,
    pub authorization_rules_program: Option<AccountInfo<'a>>,
}

#[inline(always)]
pub fn get_metaplex_transfer_params(
    accounts: Vec<AccountInfo>,
    authorization_data: Option<AuthorizationData>,
) -> MetaplexTransferParams {
    let nft_metadata: Option<AccountInfo> = accounts.get(1).cloned();
    let nft_edition: Option<AccountInfo> = accounts.get(2).cloned();
    let owner_token_record: Option<AccountInfo> = accounts.get(3).cloned();
    let dest_token_record: Option<AccountInfo> = accounts.get(4).cloned();
    let authorization_rules: Option<AccountInfo> = accounts.get(5).cloned();
    let authorization_rules_program: Option<AccountInfo> = accounts.get(6).cloned();

    MetaplexTransferParams {
        nft_metadata,
        nft_edition,
        owner_token_record,
        dest_token_record,
        authorization_rules,
        authorization_data,
        authorization_rules_program,
    }
}

pub fn parse_remaining_accounts_pnft(
    remaining_accounts: Vec<AccountInfo>,
    potential_existing_delegate: bool, //if there is a chance a delegate exista and can interfere
    extra_pnft_accounts: Option<usize>, //if there are extra pnfts tacked onto the end
) -> ParsedRemainingAccounts {
    let mut account_index = 0;
    //first 4 are either default pubkeys or pnft accounts
    let pnft_params = parse_pnft_accounts(remaining_accounts.clone());
    account_index += 4;
    account_index += extra_pnft_accounts.unwrap_or(0);
    let delegate_record = if account_index < remaining_accounts.len() {
        parse_delegate_record(remaining_accounts[account_index..].to_vec())
    } else {
        None
    };
    account_index += 1;
    //next 2 are existing delegate if possible
    let existing_delegate_params =
        if potential_existing_delegate && account_index < remaining_accounts.len() {
            let delegate_accounts =
                parse_existing_delegate_accounts(remaining_accounts[account_index..].to_vec());
            account_index += 2;
            delegate_accounts
        } else {
            None
        };

    account_index += 2;

    let creator_token_accounts = if account_index < remaining_accounts.len() {
        remaining_accounts[account_index..].to_vec()
    } else {
        Vec::new()
    };

    ParsedRemainingAccounts {
        existing_delegate_params,
        delegate_record,
        pnft_params,
        creator_token_accounts,
    }
}

pub fn get_fee_amount(order_price: u64, market_fee_bps: u64) -> u64 {
    (order_price.checked_mul(market_fee_bps))
        .unwrap()
        .checked_div(10000)
        .unwrap()
}

pub fn get_amount_from_bp(amount: u64, bp: u128) -> Result<u64> {
    let pct_value_u128 = u128::from(amount)
        .checked_mul(bp)
        .ok_or(MarketError::AmountOverflow)?
        .checked_div(100 * 100)
        .ok_or(MarketError::AmountOverflow)?;
    let pct_value = u64::try_from(pct_value_u128).unwrap_or(0);

    Ok(pct_value)
}

pub fn validate_associated_token_account(
    token_account: &AccountInfo,
    owner: &Pubkey,
    mint: &Pubkey,
    token_program: &Pubkey,
) -> Result<()> {
    let expected_ata = get_associated_token_address(owner, mint);

    require!(
        token_account.key == &expected_ata,
        MarketError::WrongAccount
    );

    require!(
        token_account.owner == token_program,
        MarketError::WrongAccount
    );

    Ok(())
}

#[inline(never)]
pub fn create_ata<'info>(
    ata: &AccountInfo<'info>,
    payer: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    owner: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
) -> Result<()> {
    if *ata.key
        != spl_associated_token_account::get_associated_token_address_with_program_id(
            owner.key,
            mint.key,
            token_program.key,
        )
    {
        return Err(MarketError::WrongAccount.into());
    }

    if !ata.to_account_info().data_is_empty() {
        return Ok(());
    }

    let ix = create_associated_token_account(payer.key, owner.key, mint.key, token_program.key);

    invoke(
        &ix,
        &vec![
            payer.to_account_info(),
            ata.to_account_info(),
            owner.to_account_info(),
            mint.to_account_info(),
            system_program.to_account_info(),
            token_program.to_account_info(),
        ],
    )?;

    Ok(())
}

pub struct WrapSolAccounts<'info> {
    pub user: AccountInfo<'info>,
    pub user_ta: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub wsol_mint: AccountInfo<'info>,
}

pub struct UnwrapSolAccounts<'info> {
    pub user: AccountInfo<'info>,
    pub user_ta: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

pub const WSOL_MINT: Pubkey = pubkey!("So11111111111111111111111111111111111111112");

#[inline(never)]
pub fn invoke_wrap_sol(accounts: &WrapSolAccounts, amount: u64) -> Result<()> {
    // Create ATA if it doesn't exist

    create_ata(
        &accounts.user_ta.to_account_info(),
        &accounts.user.to_account_info(),
        &accounts.wsol_mint,
        &accounts.user.to_account_info(),
        &accounts.system_program,
        &accounts.token_program,
    )?;

    // Transfer SOL to the ATA
    let ix = transfer(&accounts.user.key, &accounts.user_ta.key, amount);

    invoke(
        &ix,
        &[
            accounts.user.to_account_info(),
            accounts.user_ta.to_account_info(),
            accounts.system_program.to_account_info(),
        ],
    )?;

    // Sync the ATA balance
    let ix = spl_token::instruction::sync_native(&spl_token::ID, &accounts.user_ta.key)?;
    invoke(
        &ix,
        &[
            accounts.user_ta.to_account_info(),
            accounts.token_program.to_account_info(),
        ],
    )?;

    Ok(())
}

#[inline(never)]
pub fn invoke_unwrap_sol(accounts: &UnwrapSolAccounts) -> Result<()> {
    match spl_token::instruction::close_account(
        &spl_token::ID,
        &accounts.user_ta.key,
        &accounts.user.key,
        &accounts.user.key,
        &[],
    ) {
        Ok(ix) => {
            match invoke(
                &ix,
                &[
                    accounts.user_ta.to_account_info(),
                    accounts.user.to_account_info(),
                    accounts.token_program.to_account_info(),
                ],
            ) {
                Ok(_) => Ok(()),
                Err(e) => {
                    msg!("Error closing wsol account: {:?}", e);
                    Err(e.into())
                }
            }
        }
        Err(e) => {
            msg!("Error creating close account instruction: {:?}", e);
            Err(e.into())
        }
    }
}
