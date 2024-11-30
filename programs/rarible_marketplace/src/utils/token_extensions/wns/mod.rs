use crate::errors::MarketError;
use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::spl_token_2022::extension::group_member_pointer::GroupMemberPointer,
    token_interface::get_mint_extension_data,
};
use wen_new_standard::TokenGroupMember;

pub struct WnsApprovalAccounts<'info> {
    pub approval_account: AccountInfo<'info>,
    pub distribution_account: AccountInfo<'info>,
    pub distribution_token_account: AccountInfo<'info>,
    pub distribution_program: AccountInfo<'info>,
    pub payment_mint: AccountInfo<'info>,
}

pub fn verify_wns_mint<'info>(
    mint: AccountInfo<'info>,
    wns_member_acc: AccountInfo<'info>,
    market_id: Pubkey,
) -> Result<()> {
    let group_info: GroupMemberPointer =
        get_mint_extension_data::<GroupMemberPointer>(&mint).unwrap();

    let wns_member =
        TokenGroupMember::deserialize(&mut &wns_member_acc.to_account_info().data.borrow()[8..])?;
    let group_id = wns_member.group;
    let member_mint = wns_member.mint;

    if group_info.member_address.0 != wns_member_acc.key() {
        return Err(MarketError::InvalidNft.into());
    }
    if group_id == market_id && mint.key() == member_mint {
        return Ok(());
    } else {
        return Err(MarketError::InvalidNft.into());
    }
}
