import * as anchor from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { Program, web3 } from "@coral-xyz/anchor";

import { WenTransferGuard } from "../target/types/wen_transfer_guard";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getExtraAccountMetaAddress,
  getMintLen,
} from "@solana/spl-token";
import { ProgramTestContext, startAnchor } from "solana-bankrun";

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

const kMINT = {
  keypair: web3.Keypair.generate(),
  decimals: 9,
  mintAmount: 1e9,
  mintAuthority: web3.Keypair.generate(),
};
const kSOURCE_AUTHORITY = web3.Keypair.generate();
const kDESTINATION_AUTHORITY = web3.Keypair.generate();

const createMint = async (
  programId: web3.PublicKey,
  payer: web3.Signer,
  provider: BankrunProvider,
  MINT = kMINT,
  SOURCE_AUTHORITY = kSOURCE_AUTHORITY,
  DESTINATION_AUTHORITY = kDESTINATION_AUTHORITY
) => {
  const extensions = [ExtensionType.TransferHook];
  const mintLen = getMintLen(extensions);
  const lamports = 1e9;

  const sourceAta = getAssociatedTokenAddressSync(
    MINT.keypair.publicKey,
    SOURCE_AUTHORITY.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const destinationAta = getAssociatedTokenAddressSync(
    MINT.keypair.publicKey,
    DESTINATION_AUTHORITY.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const ixs = [
    web3.SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: MINT.keypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferHookInstruction(
      MINT.keypair.publicKey,
      MINT.mintAuthority.publicKey,
      programId,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      MINT.keypair.publicKey,
      MINT.decimals,
      MINT.mintAuthority.publicKey,
      MINT.mintAuthority.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      sourceAta,
      SOURCE_AUTHORITY.publicKey,
      MINT.keypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      destinationAta,
      DESTINATION_AUTHORITY.publicKey,
      MINT.keypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createMintToInstruction(
      MINT.keypair.publicKey,
      sourceAta,
      MINT.mintAuthority.publicKey,
      MINT.mintAmount,
      [],
      TOKEN_2022_PROGRAM_ID
    ),
  ];

  const txId = await sendSignedVtx(
    provider,
    payer.publicKey,
    [payer, MINT.keypair, MINT.mintAuthority],
    ...ixs
  );

  return {
    sourceAta,
    destinationAta,
    txId,
  };
};

describe("wen_transfer_guard", () => {
  // Anchor + Bankrun Tooling
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: anchor.Program<WenTransferGuard>;

  let kSourceAta: web3.PublicKey | null = null;
  let kDestinationAta: web3.PublicKey | null = null;
  let kExtraMetasAddress: web3.PublicKey | null = null;

  before(async () => {
    context = await startAnchor("./", [], []);
    provider = new BankrunProvider(context);
    const idl = require("../target/idl/wen_transfer_guard.json");
    program = new Program<WenTransferGuard>(idl, provider);

    const extraMetasAddress = getExtraAccountMetaAddress(
      kMINT.keypair.publicKey,
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
  });

  it("[Transfer Guards] - Initializes a Transfer Guard", async () => {});
  it("[Transfer Guards] - Updates a Transfer Guard", async () => {});
  it("[Transfer Hook] - Assigns guard to Mint via Init", async () => {});
  it("[Transfer Hook] - Executes correctly during transfer", async () => {});
});
