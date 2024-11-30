npx ts-node ./src/cli/createDeployment.ts \
  -t 5dL2dd2ZBQs92XXbaRV7ZH2FJ6k5euinM3Sg1FhkktJF \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  -s AOFE \
  --maxNumberOfTokens 70221 \
  --maxMintsPerWallet 1000000 \
  -u "https://bafybeiekoh7qusezbcltttym6ja2ai3vxftx2izokbtumuahys3juw5grq.ipfs.w3s.link/figure31-meta.json" \
  -n "AOFE" \
  --creators 5dL2dd2ZBQs92XXbaRV7ZH2FJ6k5euinM3Sg1FhkktJF:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 650000 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "ipfs://bafybeib3ogmisx45y45er4jjxi3nd7cta5smeapdoueodkt363g4loeisa/{}.json" \
  --itemBaseName "AOFE"

npx ts-node ./src/cli/addPhase.ts \
  -d 3bHD7zQGmxVJnxJaSCkzrZyPRUH9Tx5RjkMjUN8fyRTU \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 300 \
  --maxMintsTotal 70221 \
  --priceAmount 0 \
  -s 1731682800 \
  -e 1732287600
  # --isPrivate true \
  # --merkleRootPath ./scripts/figure31-deploy/merkle_tree.json

npx ts-node ./src/cli/addPhase.ts \
  -d 3bHD7zQGmxVJnxJaSCkzrZyPRUH9Tx5RjkMjUN8fyRTU \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 300 \
  --maxMintsTotal 70221 \
  --priceAmount 0 \
  -s 1732287600 \
  -e 1732485600

npx ts-node ./src/cli/mintWithControls.ts \
  -d 3bHD7zQGmxVJnxJaSCkzrZyPRUH9Tx5RjkMjUN8fyRTU \
  -k ~/.config/solana/id.json  \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  -p 0 \
  -n 1
  # --merkleProofPath /Users/vfadeev/Work/solana/protocol-contracts-svm/packages/protocol-contracts-svm-editions-controls-cli/scripts/figure31-deploy/proofs/QjzRL6VwKGnpco8wx3cPjtq8ZPhewy7ohq7F5mv2eeR.json \
  # --allowListPrice 30000 \
  # --allowListMaxClaims 2

