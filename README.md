# Wen New Standard
Current Version: ```0.0.1```

The current WNS version shows the minting of a non-fungible token from the Token Extensions [(Token 2022)](https://spl.solana.com/token-2022) program. It restricts the decimals to 0 and the supply of the mint to 1. It also initializes core metadata of Name, Symbol, and Uri as apart of the token directly. There are no external metadata accounts or programs needed. Group and Member accounts are copies of the Solana Extensions and will be migrated to be within the mint account once they're released on mainnet. Royalties are implmented via the extra_metadata field in the Metadata account and distributed through the Wen Royalty Distribution Contract.

A sample NFT collection from this version is [here](https://www.tensor.trade/trade/assetdash_elements).

## Specification
The work-in-progress specification for this implementation can be found [here](https://docs.google.com/document/d/1IF9osst7OmX8nwkLDtDSin_b-zkQsj7GhS0x7T0TQcg/edit).

## Proposal
The initial proposal in the Jupiter Research Forum can be found [here]()

## Proposal
Next steps for this repository are fully featuring the NFT's to include the most common functionalities requested by NFT communities including:
- Collection Instructions
    - Remove NFT from Collection
- Metadata Instructions
    - Update creators
    - Update royalties amount
- Token Instructions
    - Burn
    - Freeze
    - Unfreeze

After these are completed, WNS will need sufficient tooling including group mint contracts, CLI tooling, and more.

## Developing
Wen New Standard Relies on Token Extension program and is built using the Anchor Framework. As of now, Anchor does not support Token Extensions directly beyond the core functions. We have written implementations for most extensions and are working to get these changes merged into Anchor proper. While waiting for these changes to be published, we have compiled the most recent fork into a binary in the root of this repository ```anchor```. 
