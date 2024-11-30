npx ts-node ./src/cli/createDeployment.ts \
  -t 5GX68vDNX99NVjTDCf7wuUWQoDw2qvxNruU8TdfJKZjz \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  -s BLU \
  --maxNumberOfTokens 0 \
  --maxMintsPerWallet 10000 \
  -u "https://ipfs.raribleuserdata.com/ipfs/QmZgbRFoL3k73N13m4fASTBPVRLjThnbGasTzgVsqHVyAg" \
  -n "Blue" \
  --creators 5GX68vDNX99NVjTDCf7wuUWQoDw2qvxNruU8TdfJKZjz:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 650000 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "https://ipfs.raribleuserdata.com/ipfs/Qmc5wNJjEc2LU5dCtDGMH416Nu9Dp3f62T8Viuyr5qV5xQ" \
  --itemBaseName "Blue"

npx ts-node ./src/cli/addPhase.ts \
  -d 8Nga3QCpWiXjZrF8ap7e8ceWVQocdQbW6GdZMubfQ17n \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 10000 \
  --maxMintsTotal 0 \
  --priceAmount 580000 \
  -s 1733148000 \
  -e 1733752800