import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";

import { WenTransferGuard } from "../target/types/wen_transfer_guard";
import {
  ExtensionType,
  ExtraAccountMeta,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getExtraAccountMetaAddress,
  getMintLen,
  addExtraAccountMetasForExecute,
  createTransferCheckedInstruction,
} from "@solana/spl-token";

describe("wen_transfer_guard", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const { connection, wallet } = provider;
  const program = anchor.workspace.WenNewStandard as Program<WenTransferGuard>;

  const mintAuthority = web3.Keypair.generate();
  const payer = web3.Keypair.generate();
  const mint = web3.Keypair.generate();
  const sourceAuthority = web3.Keypair.generate();
  const destinationAuthority = web3.Keypair.generate().publicKey;

  let source: web3.PublicKey = null;
  let destination: web3.PublicKey = null;

  let extraMetasAddress: web3.PublicKey = null;

  const decimals = 2;
  const mintAmount = 100;
  const transferAmount = 10;

  const extraMetas: ExtraAccountMeta[] = [
    {
      discriminator: 0,
      addressConfig: web3.Keypair.generate().publicKey.toBuffer(),
      isWritable: false,
      isSigner: false,
    },
  ];

  before(async () => {
    const extensions = [ExtensionType.TransferHook];
    const mintLen = getMintLen(extensions);
    const lamports =
      await provider.connection.getMinimumBalanceForRentExemption(mintLen);

    source = getAssociatedTokenAddressSync(
      mint.publicKey,
      sourceAuthority.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    destination = getAssociatedTokenAddressSync(
      mint.publicKey,
      destinationAuthority,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    extraMetasAddress = getExtraAccountMetaAddress(
      mint.publicKey,
      program.programId
    );

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeTransferHookInstruction(
        mint.publicKey,
        mintAuthority.publicKey,
        program.programId,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        mintAuthority.publicKey,
        mintAuthority.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        source,
        sourceAuthority.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        destination,
        destinationAuthority,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createMintToInstruction(
        mint.publicKey,
        source,
        mintAuthority.publicKey,
        mintAmount,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 10000000000),
      "confirmed"
    );

    await web3.sendAndConfirmTransaction(provider.connection, transaction, [
      payer,
      mint,
      mintAuthority,
    ]);
  });

  it("Can transfer with extra account metas", async () => {
    // Initialize the extra metas
    await program.methods
      .initialize(extraMetas as any[])
      .accountsStrict({
        extraMetasAccount: extraMetasAddress,
        mint: mint.publicKey,
        mintAuthority: mintAuthority.publicKey,
        payer: payer.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([mintAuthority])
      .rpc();

    const ix = await addExtraAccountMetasForExecute(
      provider.connection,
      createTransferCheckedInstruction(
        source,
        mint.publicKey,
        destination,
        sourceAuthority.publicKey,
        transferAmount,
        decimals,
        undefined,
        TOKEN_2022_PROGRAM_ID
      ),
      TOKEN_2022_PROGRAM_ID,
      source,
      mint.publicKey,
      destination,
      sourceAuthority.publicKey,
      transferAmount
    );

    await web3.sendAndConfirmTransaction(
      provider.connection,
      new web3.Transaction().add(ix),
      [payer, sourceAuthority]
    );
  });
});
