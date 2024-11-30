import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export interface CollectionConfig {
  symbol: string;
  maxMintsPerWallet: anchor.BN;
  maxNumberOfTokens: anchor.BN;
  collectionName: string;
  collectionUri: string;
  royalties: {
    royaltyBasisPoints: anchor.BN;
    creators: { address: PublicKey; share: number }[];
  };
  platformFee: {
    platformFeeValue: anchor.BN;
    recipients: { address: PublicKey; share: number }[];
    isFeeFlat: boolean;
  };
  extraMeta: { field: string; value: string }[];
  itemBaseUri: string;
  itemBaseName: string;
  treasury: PublicKey;
  cosignerProgramId: PublicKey | null;
}

export interface AllowListConfig {
  merkleRoot: Buffer;
  list: {
    address: PublicKey;
    price: anchor.BN;
    max_claims: anchor.BN;
    proof: Buffer[];
  }[];
}

export interface PhaseConfig {
  maxMintsPerWallet: anchor.BN;
  maxMintsTotal: anchor.BN;
  priceAmount: anchor.BN;
  startTime: anchor.BN;
  endTime: anchor.BN;
  priceToken: PublicKey;
  isPrivate: boolean;
  merkleRoot: Buffer | null;
}
