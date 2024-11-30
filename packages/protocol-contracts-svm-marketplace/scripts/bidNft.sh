# BtZA5hmzf6m7gXRRLzvXi1sb8ffkqQ1CeFgBVb2Vybi8

#!/bin/bash

# Example shell script to place a bid on an NFT in the Rarible Marketplace
export ANCHOR_WALLET=~/.config/solana/id-buyer.json

npx ts-node ./src/cli/bidNft.ts \
  -k ~/.config/solana/id-buyer.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -m Rarim7DMoD45z1o25QWPsWvTdFSSEdxaxriwWZLLTic \
  --nftMint B7LVDuaAERUwWxcuodWmRQQbA8iyC4WNqK8aj16YQrex \
  --paymentMint So11111111111111111111111111111111111111112 \
  --price 100000 \
  --size 1
#  --ledger # Remove this flag if you are not using a Ledger

# Transaction ID: 4i8QktAAhXZiN6QnS9DzPcNFPyqyZ45L3Sb8MK7uQxVEGBEDPndQwraAwV4uH9Nt3nFRhYyYrksoSPFwir1ktJUZ
# Bid Order Account: 4osLbqVr2NLrwEEC3Yj5SSdhuBFFKwKfjoKLgw9e6cTr

# Transaction ID: 4SB1jCfXtzThRjW6RA7Gi48JbHWzRacXSFTPMc9JKj4Wg5kLcXJ19QJnu8sjCs6yyCAbpYPsJ2v936cutFmdBfwY
# Bid Order Account: 23TbHcWfxp4GQvs6G8w78gRNdffqLJStQUrDjYHswMG6