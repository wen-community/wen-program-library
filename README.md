# Wen New Standard
Current Version: ```0.3.2-alpha```

The current WNS version shows the minting of a non-fungible token from the Token Extensions [(Token 2022)](https://spl.solana.com/token-2022) program. It restricts the decimals to 0 and the supply of the mint to 1. It also initializes core metadata of Name, Symbol, and Uri as apart of the token directly. There are no external metadata accounts or programs needed. Group and Member accounts are copies of the Solana Extensions and will be migrated to be within the mint account once they're released on mainnet. Royalties are implmented via the extra_metadata field in the Metadata account and distributed through the Wen Royalty Distribution Contract.

A sample NFT collection from this version is [here](https://www.tensor.trade/trade/assetdash_elements).

## Specification
The work-in-progress specification for this implementation can be found [here](https://docs.google.com/document/d/1IF9osst7OmX8nwkLDtDSin_b-zkQsj7GhS0x7T0TQcg/edit).

## Proposal
The initial proposal in the Jupiter Research Forum can be found [here](https://www.jupresear.ch/t/wen-new-standard-wns-0-0/133/15).

## Proposal
Next steps for this repository are fully featuring the NFT's to include the most common functionalities requested by NFT communities including:
- Collection Instructions
    - Remove NFT from Collection

After these are completed, WNS will need sufficient tooling including group mint contracts, CLI tooling, and more.

## Developing

Wen New Standard Relies on Token Extension program and is built using the Anchor Framework.

- Use `solana-install` to ensure you have the correct version of solana available. You can check your version of solana with `solana-install --version`.
- WNS uses anchor 0.30.0. As of now, the recommend installation for 0.30.0 is:

```
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 avm --locked
avm install latest
```

Build the program and run specs:

```
anchor build
anchor test --skip-build
```