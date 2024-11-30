import {
  Transaction,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import BN from "bn.js";

import { getEditionsControlsPda } from "../utils";
import {
  decodeEditions,
  decodeEditionsControls,
  getProgramInstanceEditions,
  getProgramInstanceEditionsControls,
} from "@rarible_int/protocol-contracts-svm-core";
import { IExecutorParams } from "@rarible_int/protocol-contracts-svm-core";
import { sendSignedTransaction } from "@rarible_int/protocol-contracts-svm-core";
import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";

// Arguments for modifying royalties
export interface IModifyRoyalties {
  editionsId: string;
  royaltyBasisPoints: number;
  creators: { address: PublicKey; share: number }[];
}

export const modifyRoyalties = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IModifyRoyalties>) => {
  const { editionsId, royaltyBasisPoints, creators } = params;

  const raribleEditionsProgram = getProgramInstanceEditions(connection);
  const editionsControlsProgram = getProgramInstanceEditionsControls(connection);

  const editions = new PublicKey(editionsId);
  const editionsData = await connection.getAccountInfo(editions);
  if (!editionsData) {
    throw Error("Editions not found");
  }

  const editionsObj = decodeEditions(raribleEditionsProgram)(
    editionsData.data,
    editions
  );

  const editionsControlsPda = getEditionsControlsPda(editions)[0];
  const editionsControlsData = await connection.getAccountInfo(editionsControlsPda);
  if (!editionsControlsData) {
    throw Error("Editions controls not found");
  }

  const editionsControlsObj = decodeEditionsControls(editionsControlsProgram)(
    editionsControlsData.data,
    editionsControlsPda
  );

  // Create the instruction to modify royalties
  const instruction = await editionsControlsProgram.methods
    .modifyRoyalties({
      royaltyBasisPoints,
      creators,
    })
    .accountsStrict({
      editionsControls: editionsControlsPda,
      editionsDeployment: editions,
      payer: wallet.publicKey,
      creator: wallet.publicKey,
      mint: editionsObj.item.groupMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      raribleEditionsProgram: raribleEditionsProgram.programId,
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
