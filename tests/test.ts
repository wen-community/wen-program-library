import * as anchor from "@coral-xyz/anchor";
import { IDL, WenNewStandard } from "../target/types/wen_new_standard";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
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

  interface CreateCollectionArgs {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
    maxSize: number;
  }

  const collectionMint = Keypair.generate();
  const collectionTokenAccount = getAssociatedTokenAddressSync(collectionMint.publicKey, wallet.publicKey);
  const collectionArgs: CreateCollectionArgs = {
    mint: collectionMint.publicKey.toString(),
    name: "Test Collection",
    symbol: "TST",
    uri: "https://arweave.net/1234",
    maxSize: 100,
  };
  const groupAccount = PublicKey.findProgramAddressSync([Buffer.from("group"), collectionMint.publicKey.toBuffer()], program.programId)[0];

  const nftMint = Keypair.generate();
  const mintTokenAccount = getAssociatedTokenAddressSync(nftMint.publicKey, wallet.publicKey);
  const nftArgs: CreateNftArgs = {
    mint: nftMint.publicKey.toString(),
    name: "Test NFT",
    symbol: "TEST",
    uri: "https://arweave.net/1234",
  };
  const managerAccount = PublicKey.findProgramAddressSync([Buffer.from("manager")], program.programId)[0];
  const [extraMetasAccount] = PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), nftMint.publicKey.toBuffer()], program.programId);

  it("Create a collection", async () => {
    await program.methods
    .createGroupAccount({
      name: collectionArgs.name,
      symbol: collectionArgs.symbol,
      uri: collectionArgs.uri,
      maxSize: collectionArgs.maxSize
    })
    .accounts({
        payer: wallet.publicKey,
        authority: wallet.publicKey,
        receiver: wallet.publicKey,
        mint: collectionArgs.mint,
        mintTokenAccount: collectionTokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        group: groupAccount,
        manager: managerAccount
    })
    .signers([wallet.payer, collectionMint]).rpc({skipPreflight: true}).then(confirm).then(log);
  });

  it("Creates a new Nft", async () => {
    await program.methods
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
    .signers([wallet.payer, nftMint]).rpc({skipPreflight: true}).then(confirm).then(log);
  });
});
