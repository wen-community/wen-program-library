npx ts-node ./src/cli/createDeployment.ts \
  -t BTicWgGhoTsBANuirXS7UCeF6bxfvTnCaxM5HQRRfGZS \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  -s CAT06 \
  --maxNumberOfTokens 1000 \
  --maxMintsPerWallet 100 \
  -u "ipfs://QmfJh4B8KySR1KHaXRNWkcDBn67ZuJkzAyaVCWAS8Kcezc/0" \
  -n "Collection of Cats" \
  --creators J5xffSinbAQw65TsphSZ8gfaNGAPEfNWL9wwzGNdm3PR:100 \
  --royaltyBasisPoints 1000 \
  --platformFeeValue 0 \
  --platformFeeRecipients 4yyE2cWHJTU5cu8pem2ApVnHRDGHYvsPvsFCM2WeCPG2:100 \
  --isFeeFlat \
  --extraMeta "type:handmade" "author:Vadim" "value:important" \
  --itemBaseUri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/{}" \
  --itemBaseName "Cat #{}"


npx ts-node ./src/cli/addPhase.ts -d F3UQtVYuPEuesi4ga7aZXaq4axHrnKzzwodBdqYwhCTe -k ~/.config/solana/prod-keypair.json -r https://mainnetbeta-rpc.eclipse.xyz --maxMintsPerWallet 100 --maxMintsTotal 1000 --priceAmount 320000 -s 1709564319 -e 1959564319

npx ts-node ../src/cli/mintWithControls.ts -d F3UQtVYuPEuesi4ga7aZXaq4axHrnKzzwodBdqYwhCTe -k ~/.config/solana/prod-keypair.json -r https://mainnetbeta-rpc.eclipse.xyz -p 0 -n 1


npx ts-node ./src/cli/createDeployment.ts \
  -t BTicWgGhoTsBANuirXS7UCeF6bxfvTnCaxM5HQRRfGZS \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -s CAT05M \
  --maxNumberOfTokens 1000 \
  --maxMintsPerWallet 100 \
  -u "https://bafybeiekoh7qusezbcltttym6ja2ai3vxftx2izokbtumuahys3juw5grq.ipfs.w3s.link/figure31-meta.json" \
  -n "Collection of Cats" \
  --creators J5xffSinbAQw65TsphSZ8gfaNGAPEfNWL9wwzGNdm3PR:100 \
  --royaltyBasisPoints 1000 \
  --platformFeeValue 500000 \
  --platformFeeRecipients 4yyE2cWHJTU5cu8pem2ApVnHRDGHYvsPvsFCM2WeCPG2:100 \
  --isFeeFlat \
  --extraMeta "type:handmade" "author:Vadim" "value:important" \
  --itemBaseUri "ipfs://QmdHaufjUDJgbZzZ4eFCjtJQyeQpuNwoEvqLm5rq159vC8/{}" \
  --itemBaseName "Cat M #{}" 

npx ts-node ./src/cli/addPhase.ts -d 5rPxHARWC3XVjXfFueVzUibCNKUw22hkhdjmj5BqBxEg -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz --maxMintsPerWallet 100 --maxMintsTotal 1000 --priceAmount 500 -s 1709564319 -e 1991938380

npx ts-node ./src/cli/mintWithControls.ts -d 5rPxHARWC3XVjXfFueVzUibCNKUw22hkhdjmj5BqBxEg -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz -p 0 -n 1
