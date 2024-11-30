import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { type Provider, BN } from "@coral-xyz/anchor";
import { getEventAuthority, getMarketPda } from "../utils";
import {
  getProgramInstanceRaribleMarketplace,
  IExecutorParams,
  sendSignedTransaction,
} from "@rarible_int/protocol-contracts-svm-core";
import { InitMarketParams } from "../model";
import { PROGRAM_ID_MARKETPLACE } from "@rarible_int/protocol-contracts-svm-core";

export const initMarket = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<InitMarketParams>) => {
  const marketProgram = getProgramInstanceRaribleMarketplace(connection);
  const market = getMarketPda(params.marketIdentifier);
  const eventAuthority = getEventAuthority();

  const instruction = await marketProgram.methods
    .initMarket({
      feeBps: new BN(params.feeBps),
      feeRecipient: new PublicKey(params.feeRecipient),
    })
    .accountsStrict({
      initializer: wallet.publicKey,
      marketIdentifier: params.marketIdentifier,
      market,
      systemProgram: SystemProgram.programId,
      program: PROGRAM_ID_MARKETPLACE,
      eventAuthority,
    })
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

  return { txid, tx, market: market };
};
