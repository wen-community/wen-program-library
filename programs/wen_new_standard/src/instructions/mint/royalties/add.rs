use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use spl_tlv_account_resolution::state::ExtraAccountMetaList;

use anchor_spl::token_interface::{
    spl_token_metadata_interface::state::Field, token_metadata_update_field, transfer_hook_update,
    Mint, Token2022, TokenMetadataUpdateField, TransferHookUpdate,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

use crate::wen_transfer_guard::cpi::accounts::Initialize;
use crate::wen_transfer_guard::{cpi::initialize, ID as TRANSFER_GUARD_PROGRAM_ID};
use crate::{
    get_approve_account_pda, get_meta_list, get_meta_list_size,
    update_account_lamports_to_minimum_balance, ExtraAccountMetaListErrors, MetadataErrors,
    UpdateRoyaltiesArgs, META_LIST_ACCOUNT_SEED, ROYALTY_BASIS_POINTS_FIELD,
};
use crate::{utils::*, ID as WNS_PROGRAM_ID};

#[derive(Accounts)]
#[instruction(args: UpdateRoyaltiesArgs)]
pub struct AddRoyalties<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(
        mut,
        mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    /// CHECK: This account's data is a buffer of TLV data
    #[account(mut)]
    pub extra_metas_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> AddRoyalties<'info> {
    fn update_token_metadata_field(&self, field: Field, value: String) -> ProgramResult {
        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info(),
            update_authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token_metadata_update_field(cpi_ctx, field, value)?;
        Ok(())
    }

    fn update_transfer_hook_program_id(&self, hook_program_id: Pubkey) -> Result<()> {
        let cpi_accounts = TransferHookUpdate {
            token_program_id: self.token_program.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        transfer_hook_update(cpi_ctx, Some(hook_program_id))?;
        Ok(())
    }
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, AddRoyalties<'info>>,
    args: UpdateRoyaltiesArgs,
) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let extra_metas_account = &ctx.accounts.extra_metas_account;
    let system_program = &ctx.accounts.system_program;
    let payer = &ctx.accounts.payer;
    let authority = &ctx.accounts.authority;

    // validate that the fee_basis_point is less than 10000 (100%)
    require!(
        args.royalty_basis_points <= 10000,
        MetadataErrors::RoyaltyBasisPointsInvalid
    );

    // add royalty basis points to metadata
    ctx.accounts.update_token_metadata_field(
        Field::Key(ROYALTY_BASIS_POINTS_FIELD.to_owned()),
        args.royalty_basis_points.to_string(),
    )?;

    let mut total_share: u8 = 0;
    // add creators and their respective shares to metadata
    for creator in args.creators {
        total_share = total_share
            .checked_add(creator.share)
            .ok_or(MetadataErrors::CreatorShareInvalid)?;
        ctx.accounts.update_token_metadata_field(
            Field::Key(creator.address.to_string()),
            creator.share.to_string(),
        )?;
    }

    if total_share != 100 {
        return Err(MetadataErrors::CreatorShareInvalid.into());
    }

    let mint_key = mint.key();
    if !extra_metas_account.data_is_empty() {
        return err!(ExtraAccountMetaListErrors::ExtraAccountMetaAlreadyInitialized);
    }

    let transfer_hook_program_account_info = ctx.remaining_accounts.get(0);
    let (transfer_hook_program_id, bump) = match transfer_hook_program_account_info {
        Some(transfer_hook_program) => {
            if transfer_hook_program.key.eq(&TRANSFER_GUARD_PROGRAM_ID) {
                let bump = verify_extra_meta_account(
                    &mint.key(),
                    &extra_metas_account.key(),
                    &TRANSFER_GUARD_PROGRAM_ID,
                )?;
                (TRANSFER_GUARD_PROGRAM_ID, bump)
            } else {
                let bump = verify_extra_meta_account(
                    &mint.key(),
                    &extra_metas_account.key(),
                    &WNS_PROGRAM_ID,
                )?;
                (WNS_PROGRAM_ID, bump)
            }
        }
        None => {
            let bump = verify_extra_meta_account(
                &mint.key(),
                &extra_metas_account.key(),
                &WNS_PROGRAM_ID,
            )?;
            (WNS_PROGRAM_ID, bump)
        }
    };

    // add metadata program/transfer guard program as the transfer hook program
    ctx.accounts
        .update_transfer_hook_program_id(transfer_hook_program_id)?;

    if transfer_hook_program_id.eq(&WNS_PROGRAM_ID) {
        let signer_seeds: &[&[&[u8]]] = &[&[META_LIST_ACCOUNT_SEED, mint_key.as_ref(), &[bump]]];
        let account_size =
            ExtraAccountMetaList::size_of(get_meta_list_size(get_approve_account_pda(mint_key)))?;
        let lamports = Rent::get()?.minimum_balance(account_size);

        // create ExtraAccountMetaList account
        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_metas_account.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size as u64,
            ctx.program_id,
        )?;

        // initialize the extra metas account
        let metas = get_meta_list(get_approve_account_pda(mint_key));
        let mut data = extra_metas_account.try_borrow_mut_data()?;
        ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &metas)?;
    } else {
        let transfer_guard_program_info = transfer_hook_program_account_info.unwrap();
        let guard_account_info = ctx.remaining_accounts.get(1);
        if guard_account_info.is_none() {
            return err!(ExtraAccountMetaListErrors::InvalidGuardAccount);
        }
        let guard_account_info = guard_account_info.unwrap();
        initialize(CpiContext::new(
            transfer_guard_program_info.clone(),
            Initialize {
                extra_metas_account: extra_metas_account.to_account_info(),
                guard: guard_account_info.clone(),
                mint: mint.to_account_info(),
                payer: payer.to_account_info(),
                system_program: system_program.to_account_info(),
                transfer_hook_authority: authority.to_account_info(),
            },
        ))?;
    }

    // transfer minimum rent to mint account
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
