use anchor_lang::prelude::*;
use anchor_spl::token::*;

use crate::utils::metaplex::pnft::{transfer::metaplex_transfer, utils::AuthorizationDataLocal};

pub struct MetaplexAdditionalTransferAccounts<'info> {
    pub metadata: AccountInfo<'info>,
    pub edition: AccountInfo<'info>,
    pub extra_accounts: ExtraTransferParams<'info>,
}

#[derive(Accounts)]
pub struct TransferMetaplexNft<'info> {
    /// CHECK: authority is owner
    pub authority: AccountInfo<'info>,
    /// CHECK: payer is owner
    pub payer: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub source_owner: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub source_ta: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub destination_owner: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub destination_ta: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub mint: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub metadata: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub edition: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub system_program: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub instructions: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub token_program: AccountInfo<'info>,
    /// CHECK: checked in CPI
    pub ata_program: AccountInfo<'info>,
}

pub struct ExtraTransferParams<'info> {
    pub owner_token_record: Option<AccountInfo<'info>>,
    pub dest_token_record: Option<AccountInfo<'info>>,
    pub authorization_rules: Option<AccountInfo<'info>>,
    pub authorization_data: Option<AuthorizationDataLocal>,
    pub authorization_rules_program: Option<AccountInfo<'info>>,
}

pub fn transfer_metaplex_nft<'info>(
    ctx: CpiContext<'_, '_, '_, 'info, TransferMetaplexNft<'info>>,
    params: ExtraTransferParams<'info>,
    amount: u64,
    is_pnft: bool,
) -> Result<()> {
    if is_pnft {
        metaplex_transfer(ctx, params, amount)?;
    } else {
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program,
                Transfer {
                    from: ctx.accounts.source_ta,
                    to: ctx.accounts.destination_ta,
                    authority: ctx.accounts.authority,
                },
                ctx.signer_seeds,
            ),
            amount,
        )?;
    }

    Ok(())
}

#[inline(always)]
pub fn get_extra_transfer_params(
    accounts: Vec<AccountInfo>,
    authorization_data: Option<AuthorizationDataLocal>,
    start_index: usize,
) -> ExtraTransferParams {
    if accounts.len() < start_index + 4 {
        return ExtraTransferParams {
            owner_token_record: None,
            dest_token_record: None,
            authorization_rules: None,
            authorization_data,
            authorization_rules_program: None,
        };
    }

    let owner_token_record: Option<AccountInfo> = accounts.first().cloned();
    let dest_token_record: Option<AccountInfo> = accounts.get(1).cloned();
    let authorization_rules: Option<AccountInfo> = accounts.get(2).cloned();
    let authorization_rules_program: Option<AccountInfo> = accounts.get(3).cloned();

    ExtraTransferParams {
        owner_token_record,
        dest_token_record,
        authorization_rules,
        authorization_data,
        authorization_rules_program,
    }
}

#[derive(Clone)]
pub struct MplTokenMetadata;

impl anchor_lang::Id for MplTokenMetadata {
    fn id() -> Pubkey {
        mpl_token_metadata::ID
    }
}
