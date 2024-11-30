# Transaction ID: 4i8QktAAhXZiN6QnS9DzPcNFPyqyZ45L3Sb8MK7uQxVEGBEDPndQwraAwV4uH9Nt3nFRhYyYrksoSPFwir1ktJUZ
# Bid Order Account: 4osLbqVr2NLrwEEC3Yj5SSdhuBFFKwKfjoKLgw9e6cTr
# F3GQTWUBM11RFb4HbDhtt21b8xHGqRc5UzqufRk8rRyY

#!/bin/bash

# Example shell script to buy an NFT on the Rarible Marketplace
# ~/.config/solana/id-buyer.json
export ANCHOR_WALLET=~/.config/solana/id-buyer.json

npx ts-node ./src/cli/cancelBidNft.ts \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -o 4osLbqVr2NLrwEEC3Yj5SSdhuBFFKwKfjoKLgw9e6cTr

# succes tx: 5MwiDKCGKk2kYMyGZf9ZwFyrMWoei8mcrsetzfWYoSNq1dpDSoHEwYqYGVt9vW9gU4j7o53JrFDi6ExEc3G4RRFj 