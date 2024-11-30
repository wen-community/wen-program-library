npx ts-node ./src/cli/createDeployment.ts \
  -t 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -s ASC9 \
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
  -d FAPUkUarWttzUSTt4pL1AL1Q5fCziciWyRe1RUHpgZD7 \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 300 \
  --maxMintsTotal 300 \
  --priceAmount 0 \
  -s 1732273200 \
  -e 1732285800

npx ts-node ./src/cli/mintWithControls.ts -d 9SGeGafLKhPm3iPFEfLLNR5LLKUmTa2borFq98sCZVj2 --recipient 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz -p 0 -n 1
npx ts-node ./src/cli/mintWithControlsMany.ts -d FAPUkUarWttzUSTt4pL1AL1Q5fCziciWyRe1RUHpgZD7 --recipient 7jB2kzg5FbuNjETEgjnERfznGMFs7sQ7nhoXcJzwJpxj --qty 300 -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz -p 0 -n 1

npx ts-node ./src/cli/controls/modifyPlatformFee.ts  -k /Users/vfadeev/.config/solana/prod-keypair.json -r "https://testnet.dev2.eclipsenetwork.xyz" -d "FAPUkUarWttzUSTt4pL1AL1Q5fCziciWyRe1RUHpgZD7" --platformFeeValue "650000" --isFeeFlat --ledger true --recipients "AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100"

npx ts-node ./src/cli/addPhase.ts \
  -d FAPUkUarWttzUSTt4pL1AL1Q5fCziciWyRe1RUHpgZD7 \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 3 \
  --maxMintsTotal 10000 \
  --priceAmount 4000000 \
  -s 1732285800 \
  -e 1732372200

npx ts-node ./src/cli/addPhase.ts \
  -d FAPUkUarWttzUSTt4pL1AL1Q5fCziciWyRe1RUHpgZD7 \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 3 \
  --maxMintsTotal 10000 \
  --priceAmount 4000000 \
  -s 1732372200 \
  -e 1732977000

npx ts-node ./src/cli/addPhase.ts \
  -d 4oY7P2c6E3h7SgunSZGMaeSeNHqMU65GkfYuh7e9Xamv \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 3 \
  --maxMintsTotal 10000 \
  --priceAmount 4000000 \
  -s 1732539600 \
  -e 1732636800


npx ts-node ./src/cli/modifyPhase.ts \
  -d 4oY7P2c6E3h7SgunSZGMaeSeNHqMU65GkfYuh7e9Xamv \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  --maxMintsPerWallet 1 \
  --maxMintsTotal 10000 \
  --priceAmount 4000000 \
  -s 1732539600 \
  -e 1732636800 --phaseIndex 3

  