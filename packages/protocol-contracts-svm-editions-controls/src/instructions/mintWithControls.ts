import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import BN from "bn.js";

import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "spl-token-4";
import { getProgramInstanceEditions } from "@rarible_int/protocol-contracts-svm-core";
import { getProgramInstanceEditionsControls } from "@rarible_int/protocol-contracts-svm-core/src/program";
import {
  getEditionsControlsPda,
  getHashlistPda,
  getHashlistMarkerPda,
  getMinterStatsPda,
  getMinterStatsPhasePda,
} from "../utils";
import { IExecutorParams } from "@rarible_int/protocol-contracts-svm-core/src/IExecutorParams";
import { sendSignedTransaction } from "@rarible_int/protocol-contracts-svm-core/src/txUtils";
import {
  decodeEditions,
  decodeEditionsControls,
} from "@rarible_int/protocol-contracts-svm-core/src/program";
import { PROGRAM_ID_GROUP_EXTENSIONS } from "@rarible_int/protocol-contracts-svm-core/src/program";
import { IMintWithControls } from "../model";

const MAX_MINTS_PER_TRANSACTION = 3;

export const mintWithControls = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IMintWithControls>) => {
  const {
    phaseIndex,
    editionsId,
    numberOfMints,
    merkleProof,
    allowListPrice,
    allowListMaxClaims,
    isAllowListMint,
    recipient,
  } = params;

  const editionsControlsProgram =
    getProgramInstanceEditionsControls(connection);

  const editions = new PublicKey(editionsId);

  const editionsData = await connection.getAccountInfo(editions);

  if (!editionsData) {
    throw Error("Editions not found");
  }

  const raribleEditionsProgram = getProgramInstanceEditions(connection);

  const editionsObj = decodeEditions(raribleEditionsProgram)(
    editionsData.data,
    editions
  );

  const editionsControlsPda = getEditionsControlsPda(editions);

  const editionsControlsData = await connection.getAccountInfo(
    editionsControlsPda
  );

  const editionsControlsObj = decodeEditionsControls(editionsControlsProgram)(
    editionsControlsData.data,
    editionsControlsPda
  );

  const hashlist = getHashlistPda(editions)[0];

  const minterStats = getMinterStatsPda(editions, wallet.publicKey)[0];

  const minterStatsPhase = getMinterStatsPhasePda(
    editions,
    wallet.publicKey,
    phaseIndex
  )[0];

  let remainingMints = numberOfMints;

  let txs: Transaction[] = [];
  let ta: PublicKey = undefined;
  while (remainingMints > 0) {
    const instructions: TransactionInstruction[] = [];
    /// creates an open editions launch

    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 850_000,
      })
    );

    const mints: Keypair[] = [];
    const members: Keypair[] = [];

    for (
      let i = 0;
      i < Math.min(MAX_MINTS_PER_TRANSACTION, remainingMints);
      ++i
    ) {
      const mint = Keypair.generate();
      const member = Keypair.generate();

      mints.push(mint);
      members.push(member);

      const tokenAccount = getAssociatedTokenAddressSync(
        mint.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      ta = tokenAccount;

      const hashlistMarker = getHashlistMarkerPda(editions, mint.publicKey)[0];

      instructions.push(
        await editionsControlsProgram.methods
          .mintWithControls({
            phaseIndex,
            merkleProof: isAllowListMint ? merkleProof : null,
            allowListPrice: isAllowListMint ? new BN(allowListPrice) : null,
            allowListMaxClaims: isAllowListMint
              ? new BN(allowListMaxClaims)
              : null,
          })
          .accountsStrict({
            editionsDeployment: editions,
            editionsControls: editionsControlsPda,
            payer: wallet.publicKey,
            mint: mint.publicKey,
            member: member.publicKey,
            minterStats,
            minterStatsPhase,
            group: editionsObj.item.group,
            groupMint: editionsObj.item.groupMint,
            platformFeeRecipient1:
              editionsControlsObj.item.platformFeeRecipients[0].address,
            groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS,
            tokenAccount,
            treasury: editionsControlsObj.item.treasury,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            raribleEditionsProgram: raribleEditionsProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .signers([mint, member])
          .instruction()
      );
      if (recipient) {
        const recipientPK = new PublicKey(recipient);
        // Transfer the token to the recipient after minting
        // First, ensure the recipient's associated token account exists
        const recipientTokenAccount = getAssociatedTokenAddressSync(
          mint.publicKey,
          recipientPK,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        // Check if the recipient's token account exists
        const recipientTokenAccountInfo = await connection.getAccountInfo(
          recipientTokenAccount
        );

        if (!recipientTokenAccountInfo) {
          // Create the recipient's associated token account
          instructions.push(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              recipientTokenAccount,
              recipientPK,
              mint.publicKey,
              TOKEN_2022_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        // Add transfer instruction
        instructions.push(
          createTransferInstruction(
            tokenAccount, // Source (minter's token account)
            recipientTokenAccount, // Destination (recipient's token account)
            wallet.publicKey, // Owner of the source account
            1, // Amount to transfer (assuming NFTs have a supply of 1)
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
      }
    }

    remainingMints -= MAX_MINTS_PER_TRANSACTION;

    // transaction boilerplate - ignore for now
    const tx = new Transaction().add(...instructions);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(...mints, ...members);
    txs.push(tx);
  }

  await wallet.signAllTransactions(txs);

  for (let txi in txs) {
    await sendSignedTransaction({
      signedTransaction: txs[txi],
      connection,
      skipPreflight: false,
    });
  }

  console.log("Minting successful.");

  return {
    tokenAccount: ta.toBase58(),
    editions,
    editionsControls: editionsControlsPda,
  };
};
