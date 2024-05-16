# WEN New Stanadard (WNS)

---

## Table of Contents

- [Introduction](#introduction)
- [State](#state-structs)
- [Instructions](#program-instructions)
- [Transfer Hook](#transfer-hook)

---

## Introduction

The WEN New Standard program was created to leverage Token extensions with custom royalty enforcements. The motivation behind this program is to foster an ecosystem around the newly available extensions without needing much of external PDAs to resort towards. Group and token members with royalties bound within results in an optimal yet essential structure for both Fungible, SemiFungible and NonFungible assets.

## State

There exists a total of 5 state PDAs within the program's boundaries, in which the group and member custom accounts would be migrated to the mint address when Group extensions are live over mainnet.

- Manager - Currently this PDA is responsible for holding the collection and it's members' mint account and extension's authority to programatically change any extension configurations or to aid in any mutation under the mint account.

```rust
struct Manager {
    // bump: u8
}
```

- Group - Each collection mint account is considered a group. Whenever a collection is initialized/created, a new `Group` PDA is stored.

```rust
struct TokenGroup {
    /// The authority that can update the group
    pub update_authority: Pubkey,
    /// The token mint
    pub mint: Pubkey,
    /// The current size of the group (current member count)
    pub size: u32,
    /// The maximum number of group members
    pub max_size: u32,
}
```

- Member - Every sub collection/member mint account is considered a member. A `TokenMember` PDA is initialized when a new member mint account is created and stored with the required fields mentioned below.

```rust
struct TokenGroupMember {
    /// The token mint
    pub mint: Pubkey,
    /// The group PDA which is under
    pub group: Pubkey,
    /// The index at which the member has joined the group
    pub member_number: u32,
}
```

- Approve Transfer Account - An approve transfer account is currently a clock's slot verification account used inside the transfer hook, to check if the PDA has been initalized/assigned the right slot in the same transaction as the transfer instruction is invoked. This makes sure, that a transfer instruction cannot be called as is from another program without setting this PDA's state right. In other words, an approve account is a validity checker for any transfer instruction between any member token accounts.

```rust
struct ApproveAccount {
    // The current slot where the transfer is about to happen
    slot: u64,
}
```

- Extra Meta Account List - This account technically isn't created from scratch under this program, but since it still is being initialized under WNS program as it's owner, we mention this as well. The `ExtraMetaAccountList` PDA is also used for transfer hooks. This PDA is initialized only when royalties are being added. If no royalties are required, then the transfer hook will not be pointed to WNS, which results to not needing the `ExtraMetaAccountList`'s initialization.

---

## Program Instructions

1. `init_manager_account` - The first instruction required to be invoked by the program deployer to set a manager PDA account responsible for critical updates and mutations over the program.

#### Accounts required

- payer [signer, writable]
- manager [writable]
- system_program []

2. `create_group_account` - Allows a user to create a Token22 NFT with a custom made Group PDA to support `GroupPointerExtension`. This will be migrated to native `InitializeGroup` instruction in Token extensions program once it's available. This instruction primarily focusses on creating the mint account, initializing the required extensions, metadata and minting a token to the receiver.

#### Accounts required

- payer [signer, writable]
- authority [signer]
- group [writable]
- mint [signer, writable]
- mint_token_account [writable]
- manager
- system_program []
- associated_token_program []
- token_extensions_program []

3. `update_group_account` - Allows the group authority to update the group configurations or the base metadata

#### Accounts required

- payer [signer, writable]
- authority [signer]
- group [writable]
- mint [signer, writable]
- system_program []
- token_extensions_program []

4. `create_mint_account` - Once the transfer is completed, the vault keeps a note of `claim_data` of which creator requires how much percentage of the vault royalty funds. Allows any `creator` to withdraw their share.

#### Accounts required

- payer [signer, writable]
- authority [signer]
- receiver []
- mint [signer, writable]
- mint_token_account [writable]
- manager []
- system_program []
- associated_token_program []
- token_extensions_program []

5. `add_mint_to_group` - Once the transfer is completed, the vault keeps a note of `claim_data` of which creator requires how much percentage of the vault royalty funds. Allows any `creator` to withdraw their share.

#### Accounts required

- payer [signer, writable]
- authority [signer]
- group [writable]
- member [writable]
- mint []
- manager []
- system_program []
- token_extensions_program []

6. `burn_mint_account` - Allows the token member token account and the mint account (via token extensions close_authority) to be burnt.

#### Accounts required

- payer [signer, writable]
- user [signer]
- mint [writable]
- mint_token_account [writable]
- manager []
- token_extensions_program []

7. `freeze_mint_account` - The token member mint account must have a delegated authority (through token instructions approve) in order to freeze the token the mint_token_account

#### Accounts required

- user []
- delegate_authority [signer, writable]
- mint []
- mint_token_account [writable]
- manager []
- token_extensions_program []

8. `thaw_mint_account` - Same as `freeze_mint_account`, but for unfreezing. Allows the user to keep in custody for staking/escrow purposes without having the need to transfer.

#### Accounts required

- user []
- delegate_authority [signer, writable]
- mint []
- mint_token_account [writable]
- manager []
- token_extensions_program []

9. `add_royalties` - Allowing the creator of the NFT collection to opt in for royalties, by updating the metadata of each member NFT with the creators list/share and the basis points that would be transferred for royalty share.

#### Accounts required

- payer [signer, writable]
- authority [signer]
- mint [writable]
- extra_meta_account [writable]
- system_program []
- token_extensions_program []

10. `modify_royalties` - Allows for any modification over the already present royalty configurations.

#### Accounts required

- payer [signer, writable]
- authority [signer]
- mint [writable]
- system_program []
- token_extensions_program []

11. `add_metadata` - Allows either a collection or member NFT to add additional metadata based on the nature of the NFT. Each instruction invoke would add one entry to the tuple vector.

#### Accounts required

- payer [signer, writable]
- authority []
- mint [writable]
- token_extensions_program []
- system_program []

12. `remove_metadata` - Allows either a collection or member NFT to remove any field in additional metadata.

#### Accounts required

- payer [signer, writable]
- authority []
- mint [writable]
- token_extensions_program []
- system_program []

13. `approve_transfer` - When a transfer for an NFT is invoked via a protocol CPI, an approve transfer procedure must be present before the transfer instruction in the same transaction. This function sets the blockchain's current slot and checks in the transfer hook, whether the slot is the same or expired. By this way, we could ensure that WNS was called alongside to enforce royalties, and not bypassed. The approve transfer also makes sure to transfer the royalty funds to the distribution program's PDA if the transfer instruction is via a CPI. Else it's a regular non-enforced transfer.

#### Accounts required

- payer [signer, writable]
- authority [signer, writable]
- mint []
- payment_mint []
- approve_account [writable]
- distribution_account[writable]
- distribution_token_account [writable]
- authority_token_account[writable]
- system_program []
- distribution_program []
- token_program []

---

## Lifecycle of program

The lifecycle of WNS program can be split into two sides. Group and GroupMember. Since we have discussed in detail about the royalty-distribution program in it's respective docs, we will just focus over the WNS side of things. For a group account, the following procedures take place.

1. We `initialize` a group mint account and create a custom `TokenGroup` PDA
2. We have the options to `update` or `add/remove` any additional metadata.

Speaking of a token group member account, the following procedures take place

1. We `initialize` a member mint account with the same ways like a group account
2. A member mint account can be added to a `group`, resulting in creating a custom `TokenGroupMember` PDA
3. A member mint account can be configured with royalties that are embedded onchain with the necessary attributes.
4. A member mint account can also have it's metadata added or removed
5. Any delegate to the member NFT can have the rights to freeze/thaw the token accounts
6. We also have the option to enforce royalty for a particular NFT through `approve_transfer`

## Transfer Hook

WNS utilizes transfer hook extension to make sure the program is being utilized as a part of transfer instructions. The way how it works is that, the `ExtraMetaAccountList` is being initialized while the user/creator wishes to opt in for royalties. The account is serialized with one account (being the approve PDA), to let the Token extensions program know that the same is going to be utilized during hook `execute` function.

```rust
pub fn get_meta_list(approve_account: Pubkey) -> Vec<ExtraAccountMeta> {
    vec![ExtraAccountMeta {
        discriminator: 0,
        address_config: approve_account.to_bytes(),
        is_signer: false.into(),
        is_writable: true.into(),
    }]
}

// initialize the extra metas account
let extra_metas_account = &ctx.accounts.extra_metas_account;
let metas = get_meta_list(get_approve_account_pda(ctx.accounts.mint.key()));
let mut data = extra_metas_account.try_borrow_mut_data()?;
ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &metas)?;
```

Then during the `execute` function, the required accounts are passed via anchor's remaining accounts and checked if the slot has been set right or not. If yes, it's reset back to the original value and made sure for next seamless transfer.

```rust
if ctx.remaining_accounts.is_empty() {
    return Err(MetadataErrors::MissingApproveAccount.into());
}
let mut approve_account: ApproveAccount = AnchorDeserialize::deserialize(
    &mut &ctx.remaining_accounts[0].try_borrow_mut_data()?[8..],
)?;
if approve_account.slot == Clock::get()?.slot {
    // mark approve account as used by setting slot to 0
    approve_account.slot = 0;
    AnchorSerialize::serialize(
        &approve_account,
        &mut &mut ctx.remaining_accounts[0].try_borrow_mut_data()?[8..],
    )?;
    Ok(())
} else {
    Err(MetadataErrors::ExpiredApproveAccount.into())
}
```
