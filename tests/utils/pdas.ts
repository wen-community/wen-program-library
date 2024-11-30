import { PublicKey } from '@solana/web3.js';
import { toBufferLE } from 'bigint-buffer';

export const getEditionsPda = (
  symbol: string,
  editionsProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('editions_deployment'), Buffer.from(symbol)],
    editionsProgramId
  )[0];
};

export const getEditionsControlsPda = (
  editionsDeployment: PublicKey,
  editionsControlsProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('editions_controls'), editionsDeployment.toBuffer()],
    editionsControlsProgramId
  )[0];
};

export const getHashlistPda = (
  deployment: PublicKey,
  editionsProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('hashlist'), deployment.toBuffer()],
    editionsProgramId
  )[0];
};

export const getHashlistMarkerPda = (
  editionsDeployment: PublicKey,
  mint: PublicKey,
  editionsProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('hashlist_marker'),
      editionsDeployment.toBuffer(),
      mint.toBuffer(),
    ],
    editionsProgramId
  )[0];
};

export const getMinterStatsPda = (
  deployment: PublicKey,
  minter: PublicKey,
  editionsControlsProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('minter_stats'), deployment.toBuffer(), minter.toBuffer()],
    editionsControlsProgramId
  )[0];
};

export const getMinterStatsPhasePda = (
  deployment: PublicKey,
  minter: PublicKey,
  phaseIndex: number,
  editionsControlsProgramId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('minter_stats_phase'),
      deployment.toBuffer(),
      minter.toBuffer(),
      toBufferLE(BigInt(phaseIndex), 4),
    ],
    editionsControlsProgramId
  )[0];
};
