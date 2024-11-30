import {
  AccountMeta,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAtaAddress,
  getEventAuthority,
  getMarketPda,
  getNftProgramFromMint,
  getOrderAccount,
  getProvider,
  getRemainingAccountsForMint,
  getTokenProgramFromMint,
} from "../utils";
import {
  getProgramInstanceRaribleMarketplace,
  IExecutorParams,
  sendSignedTransaction,
} from "@rarible_int/protocol-contracts-svm-core";
import { ListParams } from "../model";
import { PROGRAM_ID_MARKETPLACE } from "@rarible_int/protocol-contracts-svm-core";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "spl-token-4";

export const list = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<ListParams>) => {
  const marketProgram = getProgramInstanceRaribleMarketplace(connection);
  const market = getMarketPda(params.marketIdentifier);
  const eventAuthority = getEventAuthority();

  const initializer = wallet.publicKey?.toString();
  if (!initializer) {
    return undefined;
  }

  const nftMint = params.nftMint;
  if (!nftMint) return undefined;
  const provider = getProvider(connection.rpcEndpoint);

  const nftTokenProgram = await getTokenProgramFromMint(provider, nftMint);
  if (!nftTokenProgram) {
    return undefined;
  }

  const nonceKp = Keypair.generate();
  const nonce = nonceKp.publicKey;

  const nftProgram = await getNftProgramFromMint(provider, nftMint);

  const order = getOrderAccount(nonce.toString(), market.toString(), initializer);
  const initializerNftTa = getAtaAddress(
    nftMint,
    initializer,
    nftTokenProgram.toString()
  );

  const remainingAccounts: AccountMeta[] = await getRemainingAccountsForMint(
    provider,
    nftMint,
    params.extraAccountParams
  );

  // Log all account addresses before creating the instruction
  console.log("Accounts used in the transaction:");
  console.log("Initializer:", initializer);
  console.log("Market PDA:", market.toBase58());
  console.log("NFT Mint:", nftMint);
  console.log("Order Account:", order.toBase58());
  console.log("Initializer NFT Token Account:", initializerNftTa.toBase58());
  console.log(
    "NFT Program:",
    nftProgram ? nftProgram.toBase58() : PublicKey.default.toBase58()
  );
  console.log("NFT Token Program:", nftTokenProgram.toBase58());
  console.log("Event Authority:", eventAuthority.toBase58());
  console.log("System Program:", SystemProgram.programId.toBase58());
  console.log("Marketplace Program ID:", marketProgram.programId.toBase58());
  console.log(
    "SYSVAR Instructions Pubkey:",
    SYSVAR_INSTRUCTIONS_PUBKEY.toBase58()
  );
  console.log(
    "Associated Token Program ID:",
    ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
  );

  console.log("Remaining Accounts:");
  remainingAccounts.forEach((account, index) => {
    console.log(
      `Account ${index}: ${account.pubkey.toBase58()}, isSigner: ${account.isSigner}, isWritable: ${account.isWritable}`
    );
  });

  const instruction = await marketProgram.methods
    .list({
      nonce,
      paymentMint: new PublicKey(params.paymentMint),
      price: new BN(params.price),
      size: new BN(params.size),
    })
    .accountsStrict({
      initializer: provider.publicKey,
      market,
      nftMint,
      order,
      initializerNftTa,
      nftProgram: nftProgram ?? PublicKey.default,
      nftTokenProgram,
      sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      program: marketProgram.programId,
      eventAuthority,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();

  // Create the transaction and add the instruction
  const instructions = [];

  // Add compute budget instruction
  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 850_000,
    })
  );

  instructions.push(instruction);

  const tx = new Transaction().add(...instructions);

  // Set recent blockhash and fee payer
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;

  // Sign and send the transaction
  await wallet.signTransaction(tx);

  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false,
  });

  return { txid, tx, order, market: market };
};
