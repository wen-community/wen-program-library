npx ts-node ./src/cli/createDeployment.ts \
  -t 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -s ASC10 \
  --maxNumberOfTokens 10000 \
  --maxMintsPerWallet 300 \
  -u "https://ipfs.raribleuserdata.com/ipfs/QmYGkcfE9Zzm71wiKks8tWC3hkgc45vKWaod6LvEYdCHdG" \
  -n "AFTER SCHOOL CLUB" \
  --creators 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 650000 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "https://rarible-drops.s3.filebase.com/Eclipse/asc/metadata/metadata_src/{}.json" \
  --itemBaseName "ASC #{}"

npx ts-node ./src/cli/addPhase.ts \
  -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 30 \
  --maxMintsTotal 30 \
  --priceAmount 0 \
  -s 1732627200 \
  -e 1732627800

npx ts-node ./src/cli/mintWithControlsMany.ts -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz --recipient BTicWgGhoTsBANuirXS7UCeF6bxfvTnCaxM5HQRRfGZS --qty 30 -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz -p 0 -n 1

npx ts-node ./src/cli/addPhase.ts \
  -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 3 \
  --maxMintsTotal 10000 \
  --priceAmount 3200000 \
  -s 1732627800 \
  -e 1732628400

npx ts-node ./src/cli/addPhase.ts \
  -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 1 \
  --maxMintsTotal 10000 \
  --priceAmount 3200000 \
  -s 1732628400 \
  -e 1732629000

npx ts-node ./src/cli/modifyPhase.ts \
  -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 1 \
  --maxMintsTotal 10000 \
  --priceAmount 4000000 \
  -s 1732628400 \
  -e 1732629900 --phaseIndex 2

npx ts-node ./src/cli/addPhase.ts \
  -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 1 \
  --maxMintsTotal 10000 \
  --priceAmount 3200000 \
  -s 1732629900 \
  -e 1732630200

  npx ts-node ./src/cli/modifyPhase.ts \
  -d 6kAHEZJDYGjoUwUVn57KssjafFW4hzV8SASrdCrhGcSz \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 1 \
  --maxMintsTotal 10000 \
  --priceAmount 4000000 \
  -s 1732630200 \
  -e 1732630800 --phaseIndex 3