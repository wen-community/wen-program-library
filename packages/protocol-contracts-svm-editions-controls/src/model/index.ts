
import {
    Keypair,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    PublicKey,
    ComputeBudgetProgram,
  } from "@solana/web3.js";
  import BN from "bn.js";
  
export interface CreatorWithShare {
    address: PublicKey;
    share: number;
  }
  
  export interface MetadataField {
    field: string;
    value: string;
  }
  
  export interface UpdateRoyaltiesArgs {
    royaltyBasisPoints: number; // Note the camelCase field name
    creators: CreatorWithShare[];
  }
  
  // New interface for platform fee arguments
  export interface UpdatePlatformFeeArgs {
    platformFeeValue: BN;
    recipients: CreatorWithShare[];
    isFeeFlat: boolean;
  }
  
  export interface IInitializeLaunch {
    symbol: string;
    collectionUri: string;
    treasury: string;
    collectionName: string;
    maxMintsPerWallet: number; // set to 0 for unlimited
    maxNumberOfTokens: number; // set to 0 for unlimited
    royalties: UpdateRoyaltiesArgs; // royalties info (basis points and creators)
    platformFee: UpdatePlatformFeeArgs; // platform fee info
    extraMeta: MetadataField[]; // array of extra metadata fields
    itemBaseUri: string; // URI for item base metadata
    itemBaseName: string; // Name for each item
    cosignerProgramId?: PublicKey | null; // Optional cosigner program
  }

  export interface IAddPhase {
    maxMintsPerWallet: number; // set to 0 for unlimited
    priceAmount: number,
    maxMintsTotal: number,
    deploymentId: string,
    startTime: number | undefined,
    endTime: number | undefined,
    merkleRoot?: number[],
    isPrivate?: boolean
  }

  export interface IMintWithControls {
    phaseIndex: number;
    editionsId: string;
    numberOfMints: number;
    merkleProof?: number[][];
    allowListPrice?: number;
    allowListMaxClaims?: number;
    isAllowListMint: boolean;
    recipient?: string;
  }

  // Arguments for modifying platform fee
export interface IModifyPlatformFee {
  editionsId: string;
  platformFeeValue: BN; // Should be BN if required
  isFeeFlat: boolean;
  recipients: { address: PublicKey; share: number }[];
}

export interface IModifyPhase {
  deploymentId: string;
  priceAmount: number;
  priceToken: string; // PublicKey as string
  maxMintsTotal: number;
  maxMintsPerWallet: number;
  startTime: number;
  endTime: number;
  merkleRoot: number[] | null; // Assuming merkleRoot is an array of numbers or null
  isPrivate: boolean;
  active: boolean;
  phaseIndex: number;
}