import {
  Transaction,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import BN from "bn.js";

import { getEditionsControlsPda } from "../utils";
import { decodeEditions, decodeEditionsControls, getProgramInstanceEditions, getProgramInstanceEditionsControls } from "@rarible_int/protocol-contracts-svm-core";
import { IExecutorParams } from "@rarible_int/protocol-contracts-svm-core";
import { sendSignedTransaction } from "@rarible_int/protocol-contracts-svm-core";
import { IModifyPlatformFee } from "../model";

export const modifyPlatformFee = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IModifyPlatformFee>) => {
  const { editionsId, platformFeeValue, isFeeFlat, recipients } = params;

  const editionsControlsProgram = getProgramInstanceEditionsControls(connection);

  const editions = new PublicKey(editionsId);
  const editionsData = await connection.getAccountInfo(editions);

  if (!editionsData) {
    throw Error("Editions not found");
  }

  const editionsControlsPda = getEditionsControlsPda(editions)[0];
  const editionsControlsData = await connection.getAccountInfo(editionsControlsPda);

  if (!editionsControlsData) {
    throw Error("Editions controls not found");
  }

  // Create the instruction to modify the platform fee
  const instruction = await editionsControlsProgram.methods
    .modifyPlatformFee({
      platformFeeValue: new BN(platformFeeValue), // Ensure it's a BN instance
      isFeeFlat,
      recipients,
    })
    .accountsStrict({
      editionsControls: editionsControlsPda,
      editionsDeployment: editions,
      payer: wallet.publicKey,
      creator: wallet.publicKey,
    })
    .signers([])
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

  return { editions, txid };
};
