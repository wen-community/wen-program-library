# Wen Transfer Guard Program

The Wen Transfer Guard Program is a program that allows users to set up
a transfer guard for their different mints so they can enforce a set of rules during a token transfer as enforced by the token_2022 program transfer hook interface.

## How it works

First, a user must create a transfer guard account, which is a special account that holds a generic ruleset, the ownership model behind the transfer guard account is that of a simple mint with a single token issued during the creation of the account, this allows for the user to transfer ownership of the transfer guard account to another user.

Transfer guards are updateable and can be updated by the owner of the transfer guard account, the update process is done by sending a single instruction to the transfer guard program, which will update the ruleset of the transfer guard account.

Assigning a transfer guard to a mint is done by sending a single instruction called `Initialize`, which will store the `extra_metas_account` needed for the `Execute` instruction to work. During this phase, the guard will be assigned to the mint by the mint authority by adding itself to the extra metas account.

The `Execute` instruction is the one that enforces the ruleset of the transfer guard account, it will check if the transfer is allowed by the ruleset and will either allow or deny the transfer.

## Instructions summary

- `create_guard` - Creates a new transfer guard account.
- `update_guard` - Updates the ruleset of a transfer guard account.
- `initialize` - SPL_2022 Initialize interface to assign extra metas to a given mint. These metas are constrained to be a transfer guard account and an instructions sysvar account, so no args are required for this instruction.
- `execute` - SPL_2022 Execute interface that enforces the ruleset of a transfer guard account.

## Guard Ruleset modes

There are three types of rules for each guard, which can be executed at the same time at the instruction level; these are:

- `Metadata rules`: These can happen over the mint additional metadata custom fields.
- `Amount rules`: These are rules that can happen over the amount of tokens being transferred, IE, greater than or equal to the rule.
- `Cpi rules`: These can happen over the CPI calls being made during the transfer, IE: Program allowed or not allowed to call the transfer via CPI.

## Example flow - Anchor based

### Creating a guard

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
    Buffer.from("wen_token_guard"),
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