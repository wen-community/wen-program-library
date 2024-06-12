import * as anchor from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { Program, web3 } from "@coral-xyz/anchor";

import { WenTransferGuard } from "../target/types/wen_transfer_guard";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createMintToInstruction,
  createTransferCheckedWithTransferHookInstruction,
  getAssociatedTokenAddressSync,
  getExtraAccountMetaAddress,
  getMintLen,
} from "@solana/spl-token";
import { ProgramTestContext, startAnchor } from "solana-bankrun";
import { expect } from "chai";

const sendSignedVtx = async (
  provider: BankrunProvider,
  payer: web3.PublicKey,
  signers: web3.Signer[],
  ...ixs: web3.TransactionInstruction[]
) =>
  provider.sendAndConfirm(
    new web3.VersionedTransaction(
      new web3.TransactionMessage({
        payerKey: payer,
        instructions: ixs,
        recentBlockhash: provider.context.lastBlockhash,
      }).compileToV0Message()
    ),
    signers
  );

const kMint = {
  keypair: web3.Keypair.generate(),
  decimals: 9,
  mintAmount: 1e9,
  mintAuthority: web3.Keypair.generate(),
  transferHookAuthority: web3.Keypair.generate(),
};
const kSourceAuthority = web3.Keypair.generate();
const kDestinationAuthority = web3.Keypair.generate();

const createMint = async (
  programId: web3.PublicKey,
  payer: web3.Signer,
  provider: BankrunProvider,
  mint = kMint,
  sourceAuthority = kSourceAuthority,
  destinationAuthority = kDestinationAuthority
) => {
  const extensions = [ExtensionType.TransferHook];
  const mintLen = getMintLen(extensions);
  const lamports = (
    await provider.context.banksClient.getRent()
  ).minimumBalance(BigInt(mintLen));

  const sourceAta = getAssociatedTokenAddressSync(
    mint.keypair.publicKey,
    sourceAuthority.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const destinationAta = getAssociatedTokenAddressSync(
    mint.keypair.publicKey,
    destinationAuthority.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const ixs = [
    // TX: Allocate mint account
    web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.keypair.publicKey,
      space: mintLen,
      lamports: Number(lamports),
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // TX: Init transfer hook on mint
    createInitializeTransferHookInstruction(
      mint.keypair.publicKey,
      mint.transferHookAuthority.publicKey,
      programId,
      TOKEN_2022_PROGRAM_ID
    ),
    // TX: Init mint
    createInitializeMintInstruction(
      mint.keypair.publicKey,
      mint.decimals,
      mint.mintAuthority.publicKey,
      mint.mintAuthority.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    // TX: Create Source ATA
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      sourceAta,
      sourceAuthority.publicKey,
      mint.keypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    // TX: Create Destination ATA
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      destinationAta,
      destinationAuthority.publicKey,
      mint.keypair.publicKey,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    // TX: Mint to Source ATA some tokens
    createMintToInstruction(
      mint.keypair.publicKey,
      sourceAta,
      mint.mintAuthority.publicKey,
      mint.mintAmount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    ),
  ];

  const txId = await sendSignedVtx(
    provider,
    payer.publicKey,
    [payer, mint.keypair, mint.mintAuthority],
    ...ixs
  );

  return {
    sourceAta,
    destinationAta,
    txId,
  };
};

describe("[wen_transfer_guard] - Solana Bankrun test suite", () => {
  // Anchor + Bankrun Tooling
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: anchor.Program<WenTransferGuard>;

  let kSourceAta: web3.PublicKey | null = null;
  let kDestinationAta: web3.PublicKey | null = null;
  let kExtraMetasAddress: web3.PublicKey | null = null;

  let kGuard: web3.PublicKey | null = null;
  let kGuardOwner = web3.Keypair.generate();
  let kGuardMint = web3.Keypair.generate();

  let kGuardMetadata = {
    name: "Test Guard",
    symbol: "TG",
    uri: "https://bafkreiewmldtian6gxfyn354xlpuvj5zkcpvwasjzexirgdtpj44l32z44.ipfs.nftstorage.link/",
  };
  let kGuardOriginalCpiRule: { deny: { 0: anchor.web3.PublicKey[] } };
  let kGuardUpdatedCpiRule: { deny: { 0: anchor.web3.PublicKey[] } };
  const kGuardDenyNonCpiTransfersRule = {
    deny: { 0: [TOKEN_2022_PROGRAM_ID] },
  };

  before(async () => {
    context = await startAnchor(
      "./",
      [],
      [
        {
          // Guard owner starts with 1 sol for gas.
          address: kGuardOwner.publicKey,
          info: {
            lamports: 1e9,
            data: Buffer.alloc(0),
            executable: false,
            owner: web3.SystemProgram.programId,
          },
        },
        // Mint authority starts with 1 sol for gas.
        {
          address: kMint.mintAuthority.publicKey,
          info: {
            lamports: 1e9,
            data: Buffer.alloc(0),
            executable: false,
            owner: web3.SystemProgram.programId,
          },
        },
      ]
    );
    provider = new BankrunProvider(context);
    program = new Program<WenTransferGuard>(
      require("../target/idl/wen_transfer_guard.json"),
      provider
    );

    const extraMetasAddress = getExtraAccountMetaAddress(
      kMint.keypair.publicKey,
      program.programId
    );

    // Create a mint
    const { sourceAta, destinationAta } = await createMint(
      program.programId,
      context.payer,
      provider
    );

    kSourceAta = sourceAta;
    kDestinationAta = destinationAta;
    kExtraMetasAddress = extraMetasAddress;

    const [guardAddress] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("wen_token_transfer_guard"),
        Buffer.from("guard_v1"),
        kGuardMint.publicKey.toBuffer(),
      ],
      program.programId
    );

    kGuard = guardAddress;
    kGuardOriginalCpiRule = {
      deny: { 0: [program.programId, web3.PublicKey.default] },
    };
    kGuardUpdatedCpiRule = { deny: { 0: [program.programId] } };
  });

  it("[Transfer Guards] - Initializes a transfer guard.", async () => {
    const ix = await program.methods
      .createGuard({
        ...kGuardMetadata,
        additionalFieldsRule: [],
        transferAmountRule: null,
        cpiRule: kGuardOriginalCpiRule,
      })
      .accounts({
        mint: kGuardMint.publicKey,
        guardAuthority: kGuardOwner.publicKey,
        payer: context.payer.publicKey,
      })
      .instruction();

    await sendSignedVtx(
      provider,
      context.payer.publicKey,
      [context.payer, kGuardOwner, kGuardMint],
      ix
    );

    const guard = await program.account.guardV1.fetch(kGuard);
    expect(guard.mint.toString()).to.be.eq(kGuardMint.publicKey.toString());

    const denyRules = guard.cpiRule.deny[0];

    expect(denyRules[0].toString()).to.be.eq(program.programId.toString());
    expect(denyRules[1].toString()).to.be.eq(web3.PublicKey.default.toString());
  });

  it("[Transfer Guards] - Updates a transfer guard.", async () => {
    const ix = await program.methods
      .updateGuard({
        additionalFieldsRule: [],
        transferAmountRule: null,
        cpiRule: kGuardUpdatedCpiRule,
      })
      .accounts({
        mint: kGuardMint.publicKey,
        guardAuthority: kGuardOwner.publicKey,
      })
      .instruction();

    await sendSignedVtx(provider, context.payer.publicKey, [kGuardOwner], ix);

    const guard = await program.account.guardV1.fetch(kGuard);
    const denyRules = guard.cpiRule.deny[0];

    expect(denyRules.length).to.be.eq(1);
    expect(denyRules[0].toString()).to.be.eq(program.programId.toString());
  });

  it("[Transfer Hook] - Assigns guard to mint via init.", async () => {
    const ix = await program.methods
      .initialize()
      .accountsStrict({
        guard: kGuard,
        mint: kMint.keypair.publicKey,
        transferHookAuthority: kMint.transferHookAuthority.publicKey,
        payer: context.payer.publicKey,
        extraMetasAccount: kExtraMetasAddress,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    await sendSignedVtx(
      provider,
      context.payer.publicKey,
      [context.payer, kMint.transferHookAuthority],
      ix
    );
  });

  it("[Transfer Hook] - Executes correctly during transfer.", async () => {
    let ix = await createTransferCheckedWithTransferHookInstruction(
      provider.connection,
      kSourceAta,
      kMint.keypair.publicKey,
      kDestinationAta,
      kSourceAuthority.publicKey,
      BigInt(1e8),
      kMint.decimals,
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
  });

  it("[Transfer Guards] - Adds TOKEN_2022_PROGRAM_ID to deny list, non-cpi calls should fail.", async () => {
    await sendSignedVtx(
      provider,
      context.payer.publicKey,
      [kGuardOwner],
      await program.methods
        .updateGuard({
          additionalFieldsRule: [],
          transferAmountRule: null,
          cpiRule: kGuardDenyNonCpiTransfersRule,
        })
        .accounts({
          mint: kGuardMint.publicKey,
          guardAuthority: kGuardOwner.publicKey,
        })
        .instruction()
    );
    const guard = await program.account.guardV1.fetch(kGuard);
    const denyRules = guard.cpiRule.deny[0];
    expect(denyRules.length).to.be.eq(1);
    expect(denyRules[0].toString()).to.be.eq(TOKEN_2022_PROGRAM_ID.toString());

    let ix = await createTransferCheckedWithTransferHookInstruction(
      provider.connection,
      kSourceAta,
      kMint.keypair.publicKey,
      kDestinationAta,
      kSourceAuthority.publicKey,
      BigInt(2e8),
      kMint.decimals,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    try {
      await sendSignedVtx(
        provider,
        context.payer.publicKey,
        [kSourceAuthority, context.payer],
        ix
      );
    } catch (error) {
      expect(error.message).to.include("0x1770");
    }
  });

  it("[Transfer Guards] - Shouldn't initialize with a mint using a wrong transfer guard program id.", async () => {
    const wrongProgramId = web3.Keypair.generate();
    const wrongProgramMint = {
      keypair: web3.Keypair.generate(),
      decimals: 9,
      mintAmount: 1e9,
      mintAuthority: web3.Keypair.generate(),
      transferHookAuthority: web3.Keypair.generate(),
    };
    const extraMetasAddress = getExtraAccountMetaAddress(
      wrongProgramMint.keypair.publicKey,
      program.programId // Purposefully using right program id here to simulate wrong sdk usage.
    );

    await createMint(
      wrongProgramId.publicKey,
      context.payer,
      provider,
      wrongProgramMint
    );

    const ix = await program.methods
      .initialize()
      .accountsStrict({
        guard: kGuard, // Reuse the same guard.
        mint: wrongProgramMint.keypair.publicKey,
        transferHookAuthority: wrongProgramMint.transferHookAuthority.publicKey,
        payer: context.payer.publicKey,
        extraMetasAccount: extraMetasAddress,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    try {
      await sendSignedVtx(
        provider,
        context.payer.publicKey,
        [context.payer, wrongProgramMint.transferHookAuthority],
        ix
      );
    } catch (error) {
      console.log({ error });
      expect(error.message).to.include("0x1777");
    }
  });

  it("[Transfer Guards] - Shouldn't initialize with a mint using a wrong transfer guard program id.", async () => {
    const wrongProgramId = web3.Keypair.generate();
    const wrongProgramMint = {
      keypair: web3.Keypair.generate(),
      decimals: 9,
      mintAmount: 1e9,
      mintAuthority: web3.Keypair.generate(),
      transferHookAuthority: web3.Keypair.generate(),
    };
    const extraMetasAddress = getExtraAccountMetaAddress(
      wrongProgramMint.keypair.publicKey,
      program.programId // Purposefully using right program id here to simulate wrong sdk usage.
    );

    await createMint(
      wrongProgramId.publicKey,
      context.payer,
      provider,
      wrongProgramMint
    );

    const ix = await program.methods
      .initialize()
      .accountsStrict({
        guard: kGuard, // Reuse the same guard.
        mint: wrongProgramMint.keypair.publicKey,
        transferHookAuthority: wrongProgramMint.transferHookAuthority.publicKey,
        payer: context.payer.publicKey,
        extraMetasAccount: extraMetasAddress,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    try {
      await sendSignedVtx(
        provider,
        context.payer.publicKey,
        [context.payer, wrongProgramMint.transferHookAuthority],
        ix
      );
    } catch (error) {
      console.log({ error });
      expect(error.message).to.include("0x1777");
    }
  });

  // TODO: Add additional tests for the rest of the guard rules.
});
