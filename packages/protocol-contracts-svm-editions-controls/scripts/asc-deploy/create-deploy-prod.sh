npx ts-node ./src/cli/createDeployment.ts \
  -t 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  -s ASC \
  --maxNumberOfTokens 10000 \
  --maxMintsPerWallet 300 \
  -u "https://ipfs.raribleuserdata.com/ipfs/QmYGkcfE9Zzm71wiKks8tWC3hkgc45vKWaod6LvEYdCHdG" \
  -n "AFTER SCHOOL CLUB" \
  --creators 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 0 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "https://rarible-drops.s3.filebase.com/Eclipse/asc/metadata/metadata_src/{}.json" \
  --itemBaseName "ASC #{}"

npx ts-node ./src/cli/addPhase.ts \
  -d 3x6Gqc2qFTgwq87LEe1wmybPJLFZPiE8QnSXxDkrAC9E \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 300 \
  --maxMintsTotal 300 \
  --priceAmount 0 \
  -s 1732201200 \
  -e 1732208400

npx ts-node ./src/cli/mintWithControlsMany.ts -d 3x6Gqc2qFTgwq87LEe1wmybPJLFZPiE8QnSXxDkrAC9E --recipient 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj --qty 300 -k ~/.config/solana/prod-keypair.json -r https://mainnetbeta-rpc.eclipse.xyz -p 0 -n 1

npx ts-node ./src/cli/controls/modifyPlatformFee.ts  -k ~/.config/solana/prod-keypair.json -r "https://mainnetbeta-rpc.eclipse.xyz" -d 3x6Gqc2qFTgwq87LEe1wmybPJLFZPiE8QnSXxDkrAC9E --platformFeeValue "650000" --isFeeFlat --ledger true --recipients "AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100"

npx ts-node ./src/cli/addPhase.ts \
  -d 3x6Gqc2qFTgwq87LEe1wmybPJLFZPiE8QnSXxDkrAC9E \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 3 \
  --maxMintsTotal 10000 \
  --priceAmount 40000000 \
  -s 1732546800 \
  -e 1732633200

npx ts-node ./src/cli/addPhase.ts \
  -d 3x6Gqc2qFTgwq87LEe1wmybPJLFZPiE8QnSXxDkrAC9E \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 300 \
  --maxMintsTotal 10000 \
  --priceAmount 40000000 \
  -s 1732633200 \
  -e 1733238000

npx ts-node ./src/cli/modifyPhase.ts \
  -d 3x6Gqc2qFTgwq87LEe1wmybPJLFZPiE8QnSXxDkrAC9E \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  --maxMintsPerWallet 1 \
  --maxMintsTotal 10000 \
  --priceAmount 40000000 \
  -s 1732633200 \
  -e 1733238000 --phaseIndex 2