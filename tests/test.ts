import * as anchor from "@coral-xyz/anchor";
import { IDL, WenNewStandard } from "../target/types/wen_new_standard";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  Transaction,
} from "@solana/web3.js";

import { 
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID as TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("epplex-program", () => {
  const wallet = anchor.Wallet.local();
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const programId = new PublicKey("B6mq9febpdLqpwojotCEdHMDeFXZukxoQArPa94AcKAq");

  const program = new anchor.Program<WenNewStandard>(IDL, programId, provider);

  // Helpers
  function wait(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block
    })
    return signature
  }

  const log = async(signature: string): Promise<string> => {
    console.log(`Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`);
    return signature;
  }

  interface CreateNftArgs {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
  }

  interface Creator {
    address: string;
    share: number;
  }

  interface MetadataArg {
    field: string;
    value: string;
  }

  const nftMint = Keypair.generate();
  console.log(nftMint.publicKey.toBase58().toString());
  const mintTokenAccount = getAssociatedTokenAddressSync(
    nftMint.publicKey,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const nftArgs: CreateNftArgs = {
    mint: nftMint.publicKey.toString(),
    name: "Test NFT",
    symbol: "TEST",
    uri: "https://arweave.net/1234",
  };
  const managerAccount = PublicKey.findProgramAddressSync([Buffer.from("manager")], program.programId)[0];
  const [extraMetasAccount] = PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), nftMint.publicKey.toBuffer()], program.programId);

  const royaltyBasisPoints: number = 100;
  let creators: Creator[] = [{
    address: wallet.publicKey.toString(),
    share: 100,
  }];

  const metadataArgs: MetadataArg[] = [
    {
      field: "field",
      value: "value",
    },
    {
      field: "field2",
      value: "value",
    }
  ]

  it("Creates a new Nft", async () => {
    const createNftIx = await program.methods
    .createMintAccount(nftArgs)
    .accounts({
        payer: wallet.publicKey,
        authority: wallet.publicKey,
        receiver: wallet.publicKey,
        mint: nftMint.publicKey,
        mintTokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        manager: managerAccount,
        extraMetasAccount,
    })
    .instruction();

    const addRoyaltiesIx = await program.methods
    .addRoyaltiesToMint({
      royaltyBasisPoints, 
      creators
    })
    .accounts({
      payer: wallet.publicKey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      extraMetasAccount,
      mint: nftMint.publicKey,
    })
    .instruction();

    const tx = new Transaction().add(createNftIx).add(addRoyaltiesIx);
    await provider.sendAndConfirm(tx, [wallet.payer, nftMint], {skipPreflight: true}).then(confirm).then(log);
  });

  it("Add non-royalty related Metadata", async () => {
    const addNonRoyaltyRelatedMetadata = await program.methods
    .addMetadataToMint(metadataArgs)
    .accounts({
      payer: wallet.publicKey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      mint: nftMint.publicKey,
    })
    .instruction();

    const tx = new Transaction().add(addNonRoyaltyRelatedMetadata);
    await provider.sendAndConfirm(tx, [wallet.payer], {skipPreflight: true}).then(confirm).then(log);
  });

  it("Remove non-royalty related Metadata", async () => {
    const removeNonRoyaltyRelatedMetadata = await program.methods
    .removeMetadataToMint(metadataArgs)
    .accounts({
      payer: wallet.publicKey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      mint: nftMint.publicKey,
    })
    .instruction();

    const tx = new Transaction().add(removeNonRoyaltyRelatedMetadata);
    await provider.sendAndConfirm(tx, [wallet.payer], {skipPreflight: true}).then(confirm).then(log);
  });

  it("Modify the royalties of the Nft", async () => {
    creators = [
      {
        address: PublicKey.default.toString(),
        share: 100,
      }
    ];

    const modifyRoyalitesIx = await program.methods
    .modifyRoyaltiesOfMint({
      royaltyBasisPoints, 
      creators
    })
    .accounts({
      payer: wallet.publicKey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      mint: nftMint.publicKey,
    })
    .instruction();

    const tx = new Transaction().add(modifyRoyalitesIx);
    await provider.sendAndConfirm(tx, [wallet.payer], {skipPreflight: true}).then(confirm).then(log);
  });
});
