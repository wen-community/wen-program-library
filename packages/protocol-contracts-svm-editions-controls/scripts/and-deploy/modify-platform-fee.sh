#!/bin/bash

KEYPAIR_PATH="$HOME/.config/solana/prod-keypair.json"
RPC_URL="https://mainnetbeta-rpc.eclipse.xyz"
DEPLOYMENT_ID="GYYKgGzgXnk7icNYdTAqWtBLs1T7ZsAZXYsjNz1SmS6c"
PLATFORM_FEE_VALUE=628000
IS_FEE_FLAT=true
RECIPIENTS="AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100"

if [ "$IS_FEE_FLAT" = true ]; then
  IS_FEE_FLAT_FLAG="--isFeeFlat"
else
  IS_FEE_FLAT_FLAG=""
fi

npx ts-node ./src/modifyPlatformFee.ts  -k /Users/vfadeev/.config/solana/prod-keypair.json -r "https://mainnetbeta-rpc.eclipse.xyz" -d "GYYKgGzgXnk7icNYdTAqWtBLs1T7ZsAZXYsjNz1SmS6c" --platformFeeValue "640000" --isFeeFlat --ledger true --recipients "AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100"

  npx ts-node ./src/modifyPlatformFee.ts -k ~/.config/solana/prod-keypair.json -r "https://mainnetbeta-rpc.eclipse.xyz" -d "GYYKgGzgXnk7icNYdTAqWtBLs1T7ZsAZXYsjNz1SmS6c" --platformFeeValue "628000" --isFeeFlat --recipients "AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100"