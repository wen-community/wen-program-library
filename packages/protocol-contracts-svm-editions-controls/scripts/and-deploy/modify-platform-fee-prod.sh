#!/bin/bash

KEYPAIR_PATH="$HOME/.config/solana/id.json"
RPC_URL="https://mainnetbeta-rpc.eclipse.xyz"
DEPLOYMENT_ID="GYYKgGzgXnk7icNYdTAqWtBLs1T7ZsAZXYsjNz1SmS6c"
PLATFORM_FEE_VALUE=650000
IS_FEE_FLAT=true
RECIPIENTS="AsSKqK7CkxFUf3KaoQzzr8ZLPm5fFguUtVE5QwGALQQn:100"

if [ "$IS_FEE_FLAT" = true ]; then
  IS_FEE_FLAT_FLAG="--isFeeFlat"
else
  IS_FEE_FLAT_FLAG=""
fi

npx ts-node ./src/modifyPlatformFee.ts \
  -k "$KEYPAIR_PATH" \
  -r "$RPC_URL" \
  -d "$DEPLOYMENT_ID" \
  --platformFeeValue "$PLATFORM_FEE_VALUE" \
  $IS_FEE_FLAT_FLAG \
  --recipients "$RECIPIENTS" \
  --ledger true