import {
    Keypair,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    PublicKey,
  } from "@solana/web3.js";
  import BN from "bn.js";
  
  import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";
  import { getProgramInstanceEditions } from "@rarible_int/protocol-contracts-svm-core";
  import { getProgramInstanceEditionsControls } from "@rarible_int/protocol-contracts-svm-core";
  import { getEditionsControlsPda } from "../utils";
  import { IExecutorParams } from "@rarible_int/protocol-contracts-svm-core";
  import { sendSignedTransaction } from "@rarible_int/protocol-contracts-svm-core";
  import { IModifyPhase } from "../model";
  
  export const modifyPhase = async ({
    wallet,
    params,
    connection,
  }: IExecutorParams<IModifyPhase>) => {
    const {
      deploymentId,
      priceAmount,
      priceToken,
      maxMintsTotal,
      maxMintsPerWallet,
      startTime,
      endTime,
      merkleRoot,
      isPrivate,
      active,
      phaseIndex,
    } = params;
  
    const editionProgram = getProgramInstanceEditionsControls(connection);
    const raribleEditionsProgram = getProgramInstanceEditions(connection);
  
    const instructions: TransactionInstruction[] = [];
  
    const controls = getEditionsControlsPda(new PublicKey(deploymentId));
  
    instructions.push(
      await editionProgram.methods
        .modifyPhase({
          priceAmount: new BN(priceAmount),
          priceToken: new PublicKey(priceToken),
          startTime: new BN(startTime),
          maxMintsPerWallet: new BN(maxMintsPerWallet),
          maxMintsTotal: new BN(maxMintsTotal),
          endTime: new BN(endTime),
          merkleRoot: merkleRoot,
          isPrivate: isPrivate,
          active: active,
          phaseIndex: phaseIndex,
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
  
    // Transaction boilerplate
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
  