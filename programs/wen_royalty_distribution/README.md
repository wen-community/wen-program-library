# WEN Royalty Distribution

---

## Table of Contents

- [Program Instructions](#program-instructions)
- [State structs](#state-structs)
- [Lifecycle of Program](#lifecycle-of-instructions)

---

### Program Instructions

The core functionality of this program is to aid creators to be able to withdraw their royalty shares whenever a token transfer is made through a CPI (Protocols like Magic Eden or any Marketplace). There are 3 vital instructions that help us achieve the above

1. `initialize` - Allows a Distriibution account PDA to be initialized and be filled with the necessary values

#### Accounts required

- payer [signer, writable]
- group_mint (collection_nft) []
- distribution_account [writable]
- token_extensions_program []
- system_program []

2. `update` - Allows a Distribution account become a vault to either store native SOL or any SPL mentioned w.r.t the creators share fetched from the metadata under the NFT, referring the `payment_field` of the Distribution account's state.

#### Accounts required

- authority [signer, writable]
- member_mint (member_nft) []
- distribution_account [writable]
- authority_token_account [writable]
- distribution_token_account [writable]
- system_program []
- associated_token_program []
- token_extensions_program []

3. `claim` - Once the transfer is completed, the vault keeps a note of `claim_data` of which creator requires how much percentage of the vault royalty funds. Allows any `creator` to withdraw their share.

#### Accounts required

- creator [signer, writable]
- distribution_token_account [writable]
- distribution_account [writable]
- creator_token_account [writable]
- token_extensions_program []

### State structs

The distribution account contains the state values by the following struct

```rust
pub struct Creator {
    /// creator address
    pub address: Pubkey,
    /// token amount that creator can claim
    pub claim_amount: u64,
}

pub struct DistributionAccount {
    /// distribution version (currently defaulted to 1)
    pub version: u8,
    /// The collection NFT
    pub group_mint: Pubkey,
    /// payment mint for the distribution account
    pub payment_mint: Pubkey,
    #[max_len(10)] // we currently support 10 creators
    pub claim_data: Vec<Creator>,
}
```

---

### Lifecycle of program

1. The `initialize` function is called after a group account is created in WNS program. This makes sure for every collection that's being created, a distribution vault is also created at a 1:1 account mapping.

2. After member NFTs (mint accounts in WNS program), are minted, the mint accounts are added into the group account and royalty metadata fields are pushed to the individual member NFT mint address. The specific metadata fields are the following key value pairs.

- royalty_basis_points (Similar to creator_basis_points in metaplex NFTs) <=> percentage from each sale
- creator key <=> share percentage of the royalty fee.

So for example, if the royalty is 10%, and we have 2 creators who takes equal splits, the additional metadata would be of the following

```rust
let additional_metadata = Vec<[String; 2]> = [
  ["royalty_basis_points", "1000"],
  [Pubkey::new_unique().to_string(), "50"],
  [Pubkey::new_unique().to_string(), "50"],
]
```

Since in token extensions, we can't update metadata fields in batch, each additional field requires a new CPI call to the token extensions program.

Now if a program has to first call the `approve_transfer` ix to set the `Clock`'s slot value for enforcing royalties. This `approve_transfer` makes sure to transfer the funds that was used for purchase of the NFT towards the `update` function of this program resulting in depositing under the `distribution_account` or `distribution_token_account` (for SOL and SPL transfers respectively).

3. Once the transfer is done (with transfer hook execute function verifying the royalty enforcement), creators can call the `claim` function anytime they wish to withdraw their share of the royalty fund pool.
