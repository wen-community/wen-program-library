# Rarible Contracts Testing Scripts

## Overview
Rarible Marketplace is structured as an orderbook. Each market is identified by a generic pubkey. Each NFT may be added to as many markets as it wants, each pairing of NFT-Market requires a verification account. The intended flow is each NFT collection for example would be verified for the same market.

NFTs currently usable in the market contract are WNS, Generic Token Extensions NFTs, Metaplex NFTs and pNFTs.

The Client directory contains useful functions for all relevant instructions and many data fetching functions.

Users create Orders to bid or list. Orders are created within a market.

Bidding can either be done on an individual NFT or market wide. This is set with the nft_mint struct on the Order.

Listings are NFT specific.

Both Listings and Bids require setting a payment mint. This must be an SPL token, using either the original token program or Token22. Native SOL is not supported, you will need to add wrap and unwrap instructions to use wrapped SOL.

To run the script, set the URL and wallet to be used as signer using the ```ANCHOR_PROVIDER_URL``` and ```ANCHOR_WALLET``` environment variables. For example: ```export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com``` and ```export ANCHOR_WALLET=~/.config/solana/id.json```

You can update any of the variables at the top, but remember you will need to first set up a market, then verify mints you want to test with and use a payment mint that exists. 