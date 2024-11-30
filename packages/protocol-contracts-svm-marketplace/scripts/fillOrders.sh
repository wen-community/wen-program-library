# F3GQTWUBM11RFb4HbDhtt21b8xHGqRc5UzqufRk8rRyY

#!/bin/bash

# Example shell script to buy an NFT on the Rarible Marketplace
# ~/.config/solana/id-buyer.json
export ANCHOR_WALLET=~/.config/solana/id-buyer.json

npx ts-node ./src/cli/fillOrder.ts \
  -k ~/.config/solana/id-buyer.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -o EZz8BGwsN1j4FP172R5sprpXui3AQkeDtX4DoCeG5Ccb \
  --amountToFill 1
#  --ledger # Remove this flag if you are not using a Ledger