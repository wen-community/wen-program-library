npx ts-node ./src/createDeployment.ts \
  -t CykaFUdgwhWpJZxirvKw8mA6e4SRPkBzftPRzVT6hYKW \
  -k ~/.config/solana/id.json \
  -r https://testnet.dev2.eclipsenetwork.xyz \
  -s AND2 \
  --maxNumberOfTokens 0 \
  --maxMintsPerWallet 100 \
  -u "https://ipfs.raribleuserdata.com/ipfs/QmQGXvLWPTBVnMd7aEsEXytvhZBVgUTzVe8ec6JvZmDnRZ" \
  -n "Andromeda" \
  --creators CykaFUdgwhWpJZxirvKw8mA6e4SRPkBzftPRzVT6hYKW:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 600000 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "https://ipfs.raribleuserdata.com/ipfs/QmQGXvLWPTBVnMd7aEsEXytvhZBVgUTzVe8ec6JvZmDnRZ" \
  --itemBaseName "Andromeda"


npx ts-node ./src/addPhase.ts -d 6xHpXg4HkybfpM4aaHfTGNgyseE81k7cjZ9vpSiCMAC9 -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz --maxMintsPerWallet 100 --maxMintsTotal 0 --priceAmount 600000 -s 1709564319 -e 1999564319

npx ts-node ./src/mintWithControls.ts -d 6xHpXg4HkybfpM4aaHfTGNgyseE81k7cjZ9vpSiCMAC9 -k ~/.config/solana/id.json -r https://testnet.dev2.eclipsenetwork.xyz -p 0 -n 1


npx ts-node ./src/createDeployment.ts \
  -t CykaFUdgwhWpJZxirvKw8mA6e4SRPkBzftPRzVT6hYKW \
  -k ~/.config/solana/prod-keypair.json \
  -r https://mainnetbeta-rpc.eclipse.xyz \
  -s ANDR \
  --maxNumberOfTokens 0 \
  --maxMintsPerWallet 1000 \
  -u "https://ipfs.raribleuserdata.com/ipfs/QmQGXvLWPTBVnMd7aEsEXytvhZBVgUTzVe8ec6JvZmDnRZ" \
  -n "Andromeda" \
  --creators CykaFUdgwhWpJZxirvKw8mA6e4SRPkBzftPRzVT6hYKW:100 \
  --royaltyBasisPoints 500 \
  --platformFeeValue 650000 \
  --platformFeeRecipients AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100 \
  --isFeeFlat \
  --itemBaseUri "https://ipfs.raribleuserdata.com/ipfs/QmQGXvLWPTBVnMd7aEsEXytvhZBVgUTzVe8ec6JvZmDnRZ" \
  --itemBaseName "Andromeda"


npx ts-node ./src/addPhase.ts -d Fgs3auKevWQeECXasoZ1aCyuNr2cXK7rP9eKQFC3kZJv -k ~/.config/solana/prod-keypair.json -r https://mainnetbeta-rpc.eclipse.xyz --maxMintsPerWallet 1000 --maxMintsTotal 0 --priceAmount 650000 -s 1731942000 -e 1732546800

npx ts-node ./src/mintWithControls.ts -d Fgs3auKevWQeECXasoZ1aCyuNr2cXK7rP9eKQFC3kZJv -k ~/.config/solana/prod-keypair.json -r https://mainnetbeta-rpc.eclipse.xyz -p 0 -n 1
