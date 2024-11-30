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
import { getEditionsPda, loadOrCreateKeypair } from "../utils";
import {IExecutorParams} from "@rarible_int/protocol-contracts-svm-core";
import { sendSignedTransaction } from "@rarible_int/protocol-contracts-svm-core";
import { getHashlistPda } from  "../utils";
import { getProgramInstanceEditionsControls } from "@rarible_int/protocol-contracts-svm-core";
import { getEditionsControlsPda } from "../utils";
import { PROGRAM_ID_GROUP_EXTENSIONS } from "@rarible_int/protocol-contracts-svm-core";
import { IInitializeLaunch } from "../model";


export const createDeployment = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IInitializeLaunch>) => {
  const {
    symbol,
    collectionUri,
    treasury,
    maxMintsPerWallet,
    maxNumberOfTokens,
    collectionName,
    royalties,
    platformFee, // Destructure platformFee from params
    extraMeta,
    itemBaseUri,
    itemBaseName,
    cosignerProgramId,
  } = params;

  const editionsControlsProgram = getProgramInstanceEditionsControls(connection);

  const editions = getEditionsPda(symbol);
  const editionsControls = getEditionsControlsPda(editions);

  const groupMint = loadOrCreateKeypair(`group-mint-${symbol}.json`, "target/deploy");
  const group = loadOrCreateKeypair(`group-${symbol}.json`, "target/deploy");
  console.log({ groupMint: groupMint.publicKey.toBase58() });

  const hashlist = getHashlistPda(editions)[0];

  const raribleEditionsProgram = getProgramInstanceEditions(connection);
  const instructions: TransactionInstruction[] = [];

  // Ensure creators' addresses are PublicKey instances for royalties
  const royaltyCreatorsWithPublicKeys = royalties.creators.map((creator) => ({
    address: new PublicKey(creator.address),
    share: creator.share,
  }));

  // Prepare the royalties object with camelCase field names
  const royaltiesArgs = {
    royaltyBasisPoints: royalties.royaltyBasisPoints,
    creators: royaltyCreatorsWithPublicKeys,
  };

  // Ensure recipients' addresses are PublicKey instances for platform fee
  const platformFeeRecipientsWithPublicKeys = platformFee.recipients.map((recipient) => ({
    address: new PublicKey(recipient.address),
    share: recipient.share,
  }));

  // Prepare the platform fee object with platformFeeValue as BN
  const platformFeeArgs = {
    platformFeeValue: new BN(platformFee.platformFeeValue), // Convert to BN
    recipients: platformFeeRecipientsWithPublicKeys,
    isFeeFlat: platformFee.isFeeFlat,
  };

  // Creates an open editions launch with extra metadata, royalties, and platform fee
  instructions.push(
    await editionsControlsProgram.methods
      .initialiseEditionsControls({
        maxMintsPerWallet: new BN(maxMintsPerWallet),
        treasury: new PublicKey(treasury),
        maxNumberOfTokens: new BN(maxNumberOfTokens),
        symbol,
        collectionName,
        collectionUri,
        cosignerProgramId: cosignerProgramId ?? null,
        royalties: royaltiesArgs,
        platformFee: platformFeeArgs, // Pass the platform fee arguments
        extraMeta,
        itemBaseUri,
        itemBaseName,
      })
      .accountsStrict({
        editionsControls,
        editionsDeployment: editions,
        hashlist,
        payer: wallet.publicKey,
        creator: wallet.publicKey,
        groupMint: groupMint.publicKey,
        group: group.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        raribleEditionsProgram: raribleEditionsProgram.programId,
        groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS,
      })
      .signers([groupMint, group])
      .instruction()
  );

  // Modify compute units for the transaction
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 800000,
  });

  // Transaction setup
  const tx = new Transaction().add(modifyComputeUnits).add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(groupMint, group);
  await wallet.signTransaction(tx);

  // Send transaction
  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false,
  });

  return { editions, editionsControls };
};
