## Installation instructions

0. `npm install` or `yarn install`

1. Run `npm run calculate` or `yarn calculate` to fetch the accounts either on devnet or mainnet (toggle boolean inside function argument at the end of function body).

2. For STEP 1 (Resizing bump), run `npm run resize` or `yarn resize` to create an address look up table and then start resizing the accounts. The address lookup account will be printed over the terminal, hence copy it for the next step or the same step if errored out in the middle, thereby it wouldn't create another account. Address table look up is used to avoid the "Transaction too long" error by passing duplicate accounts (System program, distribution program, signer, WNS program).

3. For STEP 2 (Updating bump), run `npm run update` or `yarn update` to either create the address table lookup account or feed it via the function arguments at the end. This will make sure bump value updates are happening in the same fashion as STEP 1.
