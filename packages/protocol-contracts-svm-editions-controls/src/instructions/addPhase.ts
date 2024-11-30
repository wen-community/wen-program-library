import {
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import BN from "bn.js";

import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";
import { getProgramInstanceEditions } from "@rarible_int/protocol-contracts-svm-core";
import { getProgramInstanceEditionsControls } from "@rarible_int/protocol-contracts-svm-core";
import { getEditionsControlsPda } from "../utils";
import { IExecutorParams } from "@rarible_int/protocol-contracts-svm-core";
import { sendSignedTransaction } from "@rarible_int/protocol-contracts-svm-core";
import { IAddPhase } from "../model";

export const addPhase = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IAddPhase>) => {
  const {
    deploymentId,
    priceAmount,
    maxMintsTotal,
    maxMintsPerWallet,
    startTime,
    endTime,
    merkleRoot,
    isPrivate,
  } = params;

  const editionProgram = getProgramInstanceEditionsControls(connection);

  const raribleEditionsProgram = getProgramInstanceEditions(connection);

  const instructions: TransactionInstruction[] = [];

  const controls = getEditionsControlsPda(new PublicKey(deploymentId));

  instructions.push(
    await editionProgram.methods
      .addPhase({
        priceAmount: new BN(priceAmount),
        priceToken: new PublicKey(
          "So11111111111111111111111111111111111111112"
        ),
        startTime:
          startTime !== undefined
            ? new BN(startTime)
            : new BN(new Date().getTime() / 1000),
        maxMintsPerWallet: new BN(maxMintsPerWallet),
        maxMintsTotal: new BN(maxMintsTotal),
        /// max i64 value - this is open ended
        endTime:
          endTime !== undefined ? new BN(endTime) : new BN(9007199254740991),
        merkleRoot: merkleRoot,
        isPrivate: isPrivate,
      })
      .accountsStrict({
        editionsControls: controls,
        creator: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        raribleEditionsProgram: raribleEditionsProgram.programId,
      })
      .signers([])
      .instruction()
  );

  // transaction boilerplate - ignore for now
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  await wallet.signTransaction(tx);

  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false,
  });

  return { txid };
};
