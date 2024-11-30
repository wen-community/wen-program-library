import { BorshCoder, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { RaribleEditionsControls } from '../../target/types/rarible_editions_controls';
import { RaribleEditions } from '../../target/types/rarible_editions';
import { IdlAccounts } from '@coral-xyz/anchor';
import { getTokenMetadata as getSplTokenMetadata } from '@solana/spl-token';

export type EditionsDeployment =
  IdlAccounts<RaribleEditions>['editionsDeployment'];

export type EditionsControls =
  IdlAccounts<RaribleEditionsControls>['editionsControls'];

export type MinterStats = IdlAccounts<RaribleEditionsControls>['minterStats'];

export const decodeEditions =
  (program: Program<RaribleEditions>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const data = buffer
      ? coder.accounts.decode<EditionsDeployment>('editionsDeployment', buffer)
      : null;

    return {
      data,
      pubkey,
    };
  };

export const getEditions = async (
  connection: Connection,
  editionsPda: PublicKey,
  editionsProgram: Program<RaribleEditions>
) => {
  const editionsAccountInfo = await connection.getAccountInfo(editionsPda);
  if (!editionsAccountInfo) {
    throw new Error('Editions account not found');
  }
  const editionsDecoded = decodeEditions(editionsProgram)(
    editionsAccountInfo.data,
    editionsPda
  );
  return editionsDecoded;
};

export const logEditions = (editionsDecoded: {
  data: EditionsDeployment;
  pubkey: PublicKey;
}) => {
  console.log({
    Editions: {
      symbol: editionsDecoded.data.symbol,
      creator: editionsDecoded.data.creator.toBase58(),
      groupMint: editionsDecoded.data.groupMint.toBase58(),
      maxNumberOfTokens: editionsDecoded.data.maxNumberOfTokens.toString(),
      cosignerProgramId: editionsDecoded.data.cosignerProgramId
        ? editionsDecoded.data.cosignerProgramId.toBase58()
        : null,
      tokensMinted: editionsDecoded.data.numberOfTokensIssued.toString(),
      itemBaseName: editionsDecoded.data.itemBaseName,
      itemBaseUri: editionsDecoded.data.itemBaseUri,
      itemNameIsTemplate: editionsDecoded.data.itemNameIsTemplate,
      itemUriIsTemplate: editionsDecoded.data.itemUriIsTemplate,
    },
  });
};

export const decodeEditionsControls =
  (program: Program<RaribleEditionsControls>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const data = buffer
      ? coder.accounts.decode<EditionsControls>('editionsControls', buffer)
      : null;

    return {
      data,
      pubkey,
    };
  };

export const getEditionsControls = async (
  connection: Connection,
  editionsControlsPda: PublicKey,
  editionsControlsProgram: Program<RaribleEditionsControls>
) => {
  const editionsControlsAccountInfo = await connection.getAccountInfo(
    editionsControlsPda
  );
  if (!editionsControlsAccountInfo) {
    throw new Error(
      'EditionsControls account not found. The collection was not initialized with controls.'
    );
  }
  const editionsControlsDecoded = decodeEditionsControls(
    editionsControlsProgram
  )(editionsControlsAccountInfo.data, editionsControlsPda);
  return editionsControlsDecoded;
};

export const logEditionsControls = (editionsControlsDecoded: {
  data: EditionsControls;
  pubkey: PublicKey;
}) => {
  console.log({
    EditionsControls: {
      address: editionsControlsDecoded.pubkey.toBase58(),
      coreDeployment:
        editionsControlsDecoded.data.editionsDeployment.toBase58(),
      creator: editionsControlsDecoded.data.creator.toBase58(),
      treasury: editionsControlsDecoded.data.treasury.toBase58(),
      maxMintsPerWallet: Number(editionsControlsDecoded.data.maxMintsPerWallet),
    },
    phases: editionsControlsDecoded.data.phases.map((item, idx) => ({
      phaseIndex: idx,
      currentMints: Number(item.currentMints),
      maxMintsPerWallet: Number(item.maxMintsPerWallet),
      maxMintsTotal: Number(item.maxMintsTotal),
      startTime: Number(item.startTime),
      endTime: Number(item.endTime),
      priceAmount: Number(item.priceAmount),
      priceToken: item.priceToken ? item.priceToken.toBase58() : null,
      isPrivate: item.isPrivate,
      merkleRoot: item.merkleRoot ? JSON.stringify(item.merkleRoot) : null,
    })),
  });
};

export const parseMetadata = (
  rawMetadata: (readonly [string, string])[]
): Record<string, string> => {
  const metadata: Record<string, string> = {};
  for (const [key, value] of rawMetadata) {
    metadata[key] = value;
  }
  return metadata;
};

export const getTokenMetadata = async (
  connection: Connection,
  mint: PublicKey
) => {
  const rawMetadata = await getSplTokenMetadata(connection, mint);
  const additionalMetadata = rawMetadata.additionalMetadata;
  const parsedMetadata = parseMetadata(additionalMetadata);
  return {
    ...rawMetadata,
    additionalMetadata: parsedMetadata,
  };
};

export const logTokenMetadata = (metadata: {
  name: string;
  symbol: string;
  uri: string;
  updateAuthority?: PublicKey;
  mint: PublicKey;
  additionalMetadata: Record<string, string>;
}) => {
  console.log({
    TokenMetadata: {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      updateAuthority: metadata.updateAuthority.toBase58(),
      mint: metadata.mint.toBase58(),
      additionalMetadata: metadata.additionalMetadata,
    },
  });
};

export const decodeMinterStats =
  (program: Program<RaribleEditionsControls>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const data = buffer
      ? coder.accounts.decode<MinterStats>('minterStats', buffer)
      : null;

    return {
      data,
      pubkey,
    };
  };

export const getMinterStats = async (
  connection: Connection,
  minterStatsPda: PublicKey,
  editionsControlsProgram: Program<RaribleEditionsControls>
) => {
  const minterStatsAccountInfo = await connection.getAccountInfo(
    minterStatsPda
  );
  if (!minterStatsAccountInfo) {
    throw new Error('MinterStats account not found');
  }
  const minterStatsDecoded = decodeMinterStats(editionsControlsProgram)(
    minterStatsAccountInfo.data,
    minterStatsPda
  );
  return minterStatsDecoded;
};

export const logMinterStats = (minterStatsDecoded: {
  data: MinterStats;
  pubkey: PublicKey;
}) => {
  console.log({
    MinterStats: {
      address: minterStatsDecoded.pubkey.toBase58(),
      wallet: minterStatsDecoded.data.wallet.toBase58(),
      mintCount: minterStatsDecoded.data.mintCount.toString(),
    },
  });
};

export const logMinterStatsPhase = (minterStatsDecoded: {
  data: MinterStats;
  pubkey: PublicKey;
}) => {
  console.log({
    MinterStatsPhase: {
      address: minterStatsDecoded.pubkey.toBase58(),
      wallet: minterStatsDecoded.data.wallet.toBase58(),
      mintCount: minterStatsDecoded.data.mintCount.toString(),
    },
  });
};
