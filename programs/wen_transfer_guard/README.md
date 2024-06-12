# Wen Transfer Guard Program

The Wen Transfer Guard Program secures token transfers on the Solana blockchain by enforcing customizable rules using the token_2022 program transfer hook interface.

## How It Works

### Overview

1. **Create a Transfer Guard Account:**
   - Set up an account with a ruleset and identifiable metadata.
   
2. **Update the Guard:**
   - Modify the ruleset of the guard account.
   
3. **Initialize the Guard:**
   - Link the guard to a specific mint.
   
4. **Execute Transfer Rules:**
   - Enforce the ruleset during token transfers.

### Instructions Summary

- `create_guard`: Creates a new transfer guard account.
- `update_guard`: Updates the ruleset of a transfer guard account.
- `initialize`: Assigns extra metas to a given mint, linking the guard to it.
- `execute`: Enforces the ruleset during a token transfer.

### Guard Ruleset Modes

- **Metadata Rules:** Validate against custom metadata fields.
- **Amount Rules:** Enforce limits on the amount of tokens being transferred.
- **CPI Rules:** Control which programs can interact with the mint’s tokens.

### Example Flow (Anchor Based)

```ts
const guardMint = web3.Keypair.generate();

const guardMintAta = getAssociatedTokenAddressSync(
  guardMint.publicKey,
  guardAuthority,
  false,
  TOKEN_2022_PROGRAM_ID
);

const ix = await program.methods
  .createGuard({
    name: "Guard",
    symbol: "GRD",
    uri: "https://example.com/metadata.json",
    additionalFieldsRule: [],
    transferAmountRule: null,
    cpiRule: {
      deny: { 0: [new web3.PublicKey("11111111111111111111111111111111")] },
    },
  })
  .accounts({
    mint: guardMint.publicKey,
    mintTokenAccount: guardMintAta,
    guardAuthority,
    payer,
  })
  .instruction();

const txId = await sendSignedVtx(
  provider,
  payer.publicKey,
  [payer, guardAuthority, guardMint],
  ix
);
```

### Updating a guard

```ts
const ix = await program.methods
  .updateGuard({
    additionFieldsRule: [],
    transferAmountRule: null,
    cpiRule: {
      deny: { 0: [] },
    },
  })
  .accounts({
    mint: guardMint.publicKey,
    tokenAccount: guardMintAta,
    guardAuthority: kGuardOwner.publicKey,
  })
  .instruction();

const txId = await sendSignedVtx(provider, payer, [guardAuthority], ix);
```

### Initializing (Assign guard to mint)

```ts
const [guardAddress] = web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("wen_token_transfer_guard"),
    Buffer.from("guard_v1"),
    // Not to be confused with the actual mint for the guard to be assigned to.
    guardMint.publicKey.toBuffer(),
  ],
  program.programId
);
const extraMetasAddress = getExtraAccountMetaAddress(
  mint.publicKey,
  program.programId
);

const ix = await program.methods
  .initialize()
  .accountsStrict({
    guard: guardAddress,
    mint: mint.publicKey,
    mintAuthority: mintAuthority.publicKey,
    payer: payer.publicKey,
    extraMetasAccount: extraMetasAddress,
    systemProgram: web3.SystemProgram.programId,
  })
  .instruction();

await sendSignedVtx(provider, payer.publicKey, [payer, mintAuthority], ix);
```

### Executing a transfer

```ts
let ix = await createTransferCheckedWithTransferHookInstruction(
  provider.connection,
  sourceAta,
  mint.publicKey,
  destinationAta,
  sourceAuthority.publicKey,
  BigInt(1e8), // Amount, 1e8 would be something like 0.1 sol (If using 9 decimals).
  mint.decimals,
  undefined,
  undefined,
  TOKEN_2022_PROGRAM_ID
);

await sendSignedVtx(
  provider,
  context.payer.publicKey,
  [kSourceAuthority, context.payer],
  ix
);
```