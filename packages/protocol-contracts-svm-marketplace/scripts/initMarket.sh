#!/bin/bash

# Example shell script to initialize a Rarible Marketplace

npx ts-node ./src/cli/initMarket.ts \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -m Rarim7DMoD45z1o25QWPsWvTdFSSEdxaxriwWZLLTic \
  --feeBps 500 \
  --feeRecipient AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn