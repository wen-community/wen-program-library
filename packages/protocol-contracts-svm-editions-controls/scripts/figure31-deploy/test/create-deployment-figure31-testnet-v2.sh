npx ts-node ./src/cli/createDeployment.ts \
  -t 5dL2dd2ZBQs92XXbaRV7ZH2FJ6k5euinM3Sg1FhkktJF \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -s AOFET13 \
  --maxNumberOfTokens 70221 \
  --maxMintsPerWallet 1000000 \
  -u -u "https://bafybeiekoh7qusezbcltttym6ja2ai3vxftx2izokbtumuahys3juw5grq.ipfs.w3s.link/figure31-meta.json" \
  -n "AOFE" \
  --creators 5dL2dd2ZBQs92XXbaRV7ZH2FJ6k5euinM3Sg1FhkktJF:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 0 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "ipfs://bafybeib3ogmisx45y45er4jjxi3nd7cta5smeapdoueodkt363g4loeisa/{}.json" \
  --itemBaseName "AOFE"

npx ts-node ./src/cli/addPhase.ts \
    -d 8GERj2yoAr2wz3ET2CYG6zBRerT6noS3s9UiXUJWfQPH \
    -k ~/.config/solana/id.json \
    -r https://testnet.dev2.eclipsenetwork.xyz \
    --maxMintsPerWallet 300 \
    --maxMintsTotal 70221 \
    --priceAmount 320000 \
    -s 1701596401 \
    -e 1732201201

npx ts-node ./src/cli/addPhase.ts \
    -d 8GERj2yoAr2wz3ET2CYG6zBRerT6noS3s9UiXUJWfQPH \
    -k ~/.config/solana/id.json \
    -r https://testnet.dev2.eclipsenetwork.xyz \
    --maxMintsPerWallet 300 \
    --maxMintsTotal 70221 \
    --priceAmount 320000 \
    -s 1701596401 \
    -e 1782201201

npx ts-node ./src/cli/mintWithControls.ts \
  -d 56wx6BBU4GtLnQS9E2DbAJAREvKAuhrsia8RbLYQZ5tH \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -p 0 \
  -n 1

npx ts-node ./src/cli/mintWithControls.ts \
  -d AB5EF8EdAEJZUywTuVVmDPeoQemML1T7d7gJbMHKQHZb \
  -k ~/.config/solana/prod-keypair.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -p 0 \
  -n 1 \
  --merkleProofPath /Users/vfadeev/Work/solana/protocol-contracts-svm/packages/protocol-contracts-svm-editions-controls-cli/scripts/figure31-deploy/test/proofs_test_v2/3uiYpWUZhxNi6FNFtKh58FWLPBT1sMivRzcENu876xMV.json \
  --allowListPrice 300000 \
  --allowListMaxClaims 5

  BvvjuPAw7qpJU3B1vNpAgqPLmLErHv8izEBNbbhz936K

npx ts-node ./src/cli/mintWithControls.ts \
  -d BvvjuPAw7qpJU3B1vNpAgqPLmLErHv8izEBNbbhz936K \
  -k ~/.config/solana/prod-keypair.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -p 0 \
  -n 1 \
  --merkleProofPath /Users/vfadeev/Work/solana/protocol-contracts-svm/packages/protocol-contracts-svm-editions-controls-cli/scripts/figure31-deploy/proofs_all_v2/QjzRL6VwKGnpco8wx3cPjtq8ZPhewy7ohq7F5mv2eeR.json \
  --allowListPrice 320000 \
  --allowListMaxClaims 2