import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, ComputeBudgetProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { RaribleEditionsControls } from '../../target/types/rarible_editions_controls';
import { RaribleEditions } from '../../target/types/rarible_editions';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { estimateTransactionFee, getCluster } from '../utils/utils';
import {
  getEditions,
  getEditionsControls,
  getMinterStats,
  getTokenMetadata,
  logEditions,
  logEditionsControls,
  logMinterStats,
  logMinterStatsPhase,
  logTokenMetadata,
} from '../utils/getters';
import { Transaction } from '@solana/web3.js';
// devnote: try to make tests don't rely on hard addresses but on dynamic runtime ids.
import { TOKEN_GROUP_EXTENSION_PROGRAM_ID } from '../constants';
import { getEditionsPda, getEditionsControlsPda, getHashlistPda, getHashlistMarkerPda, getMinterStatsPda, getMinterStatsPhasePda } from '../utils/pdas';
import { CollectionConfig, AllowListConfig, PhaseConfig } from '../utils/types';

const VERBOSE_LOGGING = false;

describe('Editions Controls Test Suite', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Modify compute units
  const modifiedComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 800000,
  });

  let editionsControlsProgram: Program<RaribleEditionsControls>;
  let editionsProgram: Program<RaribleEditions>;

  let editionsPda: PublicKey;
  let editionsControlsPda: PublicKey;
  let hashlistPda: PublicKey;

  let payer: Keypair;
  let creator1: Keypair;
  let creator2: Keypair;
  let treasury: Keypair;
  let platformFeeAdmin: Keypair;
  let groupMint: Keypair;
  let group: Keypair;

  let minter0: Keypair; // in allowlist
  let minter1: Keypair; // in allowlist
  let minter2: Keypair; // not in allowlist

  let collectionConfig: CollectionConfig;
  let allowListConfig: AllowListConfig;

  let phase0Config: PhaseConfig;
  let phase1Config: PhaseConfig;
  let phase2Config: PhaseConfig;
  let phase3Config: PhaseConfig;
  let phase4Config: PhaseConfig;
  let phase5Config: PhaseConfig;

  // Generate dynamic keypairs and collection config
  before(async () => {
    if (VERBOSE_LOGGING) {
      const cluster = await getCluster(provider.connection);
      console.log('Cluster:', cluster);
    }

    editionsControlsProgram = anchor.workspace.RaribleEditionsControls as Program<RaribleEditionsControls>;
    editionsProgram = anchor.workspace.RaribleEditions as Program<RaribleEditions>;

    payer = (provider.wallet as anchor.Wallet).payer;
    creator1 = Keypair.generate();
    creator2 = Keypair.generate();
    treasury = Keypair.generate();
    platformFeeAdmin = Keypair.generate();
    groupMint = Keypair.generate();
    group = Keypair.generate();

    collectionConfig = {
      maxNumberOfTokens: new anchor.BN(20),
      symbol: 'COOLX55',
      collectionName: 'Collection name with meta, platform fee and royalties',
      collectionUri: 'ipfs://QmbsXNSkPUtYNmKfYw1mUSVuz9QU8nhu7YvzM1aAQsv6xw/0',
      treasury: treasury.publicKey,
      maxMintsPerWallet: new anchor.BN(100),
      royalties: {
        royaltyBasisPoints: new anchor.BN(1000),
        creators: [
          {
            address: creator1.publicKey,
            share: 50,
          },
          {
            address: creator2.publicKey,
            share: 50,
          },
        ],
      },
      platformFee: {
        platformFeeValue: new anchor.BN(50000),
        recipients: [
          {
            address: platformFeeAdmin.publicKey,
            share: 100,
          },
        ],
        isFeeFlat: true,
      },
      extraMeta: [
        { field: 'field1', value: 'value1' },
        { field: 'field2', value: 'value2' },
        { field: 'field3', value: 'value3' },
        { field: 'field4', value: 'value4' },
      ],
      itemBaseUri: 'ipfs://QmbsXNSkPUtYNmKfYw1mUSVuz9QU8nhu7YvzM1aAQsv6xw/{}',
      itemBaseName: 'Item T8 V4 #{}',
      cosignerProgramId: null,
    };
    if (VERBOSE_LOGGING) {
      console.log('Collection config: ', collectionConfig);
    }

    editionsPda = getEditionsPda(collectionConfig.symbol, editionsProgram.programId);
    editionsControlsPda = getEditionsControlsPda(editionsPda, editionsControlsProgram.programId);
    hashlistPda = getHashlistPda(editionsPda, editionsProgram.programId);
  });

  // Generate allowlist variables
  before(async () => {
    minter0 = Keypair.fromSecretKey(
      new Uint8Array([
        110, 76, 59, 154, 201, 225, 246, 121, 152, 90, 45, 211, 52, 244, 216, 108, 118, 248, 113, 239, 61, 248, 207, 122, 98, 26, 184, 92, 51, 97, 52, 218, 104,
        164, 83, 51, 23, 177, 193, 29, 252, 241, 86, 132, 173, 155, 114, 131, 130, 73, 27, 101, 233, 95, 12, 45, 107, 255, 120, 26, 121, 221, 120, 54,
      ])
    );
    minter1 = Keypair.fromSecretKey(
      new Uint8Array([
        16, 27, 49, 140, 228, 142, 201, 93, 199, 209, 62, 136, 151, 212, 238, 114, 46, 204, 155, 132, 26, 227, 44, 245, 239, 29, 195, 63, 77, 162, 28, 220, 186,
        39, 133, 92, 39, 241, 42, 161, 180, 15, 92, 18, 15, 101, 248, 80, 238, 254, 220, 231, 1, 14, 231, 145, 170, 49, 163, 111, 239, 112, 135, 6,
      ])
    );
    minter2 = Keypair.generate();
    allowListConfig = {
      merkleRoot: Buffer.from([
        125, 184, 194, 116, 52, 36, 65, 219, 171, 135, 154, 27, 188, 122, 207, 204, 111, 70, 66, 115, 161, 228, 44, 84, 67, 97, 29, 70, 253, 69, 11, 245,
      ]),
      list: [
        {
          address: minter0.publicKey,
          price: new anchor.BN(500000), // 0.005 SOL
          max_claims: new anchor.BN(3),
          proof: [
            Buffer.from([
              64, 131, 242, 169, 206, 112, 155, 119, 81, 214, 17, 137, 174, 140, 208, 220, 141, 177, 213, 131, 127, 104, 181, 15, 121, 228, 87, 25, 232, 172,
              235, 168,
            ]),
          ],
        },
        {
          address: minter1.publicKey,
          price: new anchor.BN(500000), // 0.005 SOL
          max_claims: new anchor.BN(3),
          proof: [
            Buffer.from([
              86, 37, 15, 136, 192, 159, 125, 244, 163, 213, 251, 242, 217, 215, 159, 249, 93, 166, 82, 38, 187, 58, 199, 64, 161, 50, 122, 122, 17, 125, 63,
              188,
            ]),
          ],
        },
      ],
    };
  });

  // Perform needed airdrops to minter0, treasury and platformFeeRecipient
  before(async () => {
    // Airdrop SOL to minter0
    const minter0AirdropSignature = await provider.connection.requestAirdrop(minter0.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(minter0AirdropSignature);

    // Airdrop SOL to minter1
    const minter1AirdropSignature = await provider.connection.requestAirdrop(minter1.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(minter1AirdropSignature);

    // Airdrop SOL to minter2
    const minter2AirdropSignature = await provider.connection.requestAirdrop(minter2.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(minter2AirdropSignature);

    // Airdrop SOL to treasury
    const treasuryAirdropSignature = await provider.connection.requestAirdrop(collectionConfig.treasury, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(treasuryAirdropSignature);

    // Airdrop SOL to platformFeeRecipient
    const platformFeeRecipientAirdropSignature = await provider.connection.requestAirdrop(platformFeeAdmin.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(platformFeeRecipientAirdropSignature);
  });

  describe('Deploying', () => {
    it('Should deploy a collection', async () => {
      // Modify compute units for the transaction
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 800000,
      });

      try {
        const initialiseIx = await editionsControlsProgram.methods
          .initialiseEditionsControls({
            maxMintsPerWallet: collectionConfig.maxMintsPerWallet,
            treasury: collectionConfig.treasury,
            maxNumberOfTokens: collectionConfig.maxNumberOfTokens,
            symbol: collectionConfig.symbol,
            collectionName: collectionConfig.collectionName,
            collectionUri: collectionConfig.collectionUri,
            cosignerProgramId: collectionConfig.cosignerProgramId,
            royalties: collectionConfig.royalties,
            platformFee: collectionConfig.platformFee,
            extraMeta: collectionConfig.extraMeta,
            itemBaseUri: collectionConfig.itemBaseUri,
            itemBaseName: collectionConfig.itemBaseName,
          })
          .accountsStrict({
            editionsControls: editionsControlsPda,
            editionsDeployment: editionsPda,
            hashlist: hashlistPda,
            payer: payer.publicKey,
            creator: payer.publicKey,
            groupMint: groupMint.publicKey,
            group: group.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            raribleEditionsProgram: editionsProgram.programId,
            groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
          })
          .instruction();

        const transaction = new Transaction().add(modifyComputeUnits).add(initialiseIx);

        await provider.sendAndConfirm(transaction, [groupMint, group, payer]);

        // Fetch updated state
        const editionsDecoded = await getEditions(provider.connection, editionsPda, editionsProgram);
        const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
        const metadata = await getTokenMetadata(provider.connection, groupMint.publicKey);
        if (VERBOSE_LOGGING) {
          logEditions(editionsDecoded);
          logEditionsControls(editionsControlsDecoded);
          logTokenMetadata(metadata);
        }

        // Verify Editions deployment
        expect(editionsDecoded.data.symbol).to.equal(collectionConfig.symbol);
        expect(editionsDecoded.data.creator.toBase58()).to.equal(editionsControlsPda.toBase58());
        expect(editionsDecoded.data.maxNumberOfTokens.toString()).to.equal(collectionConfig.maxNumberOfTokens.toString());
        expect(editionsDecoded.data.itemBaseName).to.equal(collectionConfig.itemBaseName);
        expect(editionsDecoded.data.itemBaseUri).to.equal(collectionConfig.itemBaseUri);

        // Verify EditionsControls deployment
        expect(editionsControlsDecoded.data.editionsDeployment.toBase58()).to.equal(editionsPda.toBase58());
        expect(editionsControlsDecoded.data.creator.toBase58()).to.equal(payer.publicKey.toBase58());
        expect(editionsControlsDecoded.data.treasury.toBase58()).to.equal(collectionConfig.treasury.toBase58());
        expect(Number(editionsControlsDecoded.data.maxMintsPerWallet)).to.equal(Number(collectionConfig.maxMintsPerWallet));
        expect(editionsControlsDecoded.data.phases.length).to.equal(0);

        // Verify metadata
        expect(metadata.name).to.equal(collectionConfig.collectionName);
        expect(metadata.uri).to.equal(collectionConfig.collectionUri);
        expect(metadata.mint.toBase58()).to.equal(groupMint.publicKey.toBase58());
        // Verify that every key in extraMeta is present in metadata.additionalMetadata
        collectionConfig.extraMeta.forEach((meta) => {
          expect(metadata.additionalMetadata).to.have.property(meta.field);
          expect(metadata.additionalMetadata[meta.field]).to.equal(meta.value);
        });

        // Add more assertions as needed
      } catch (error) {
        console.error('Error in initialiseEditionsControls:', error);
        throw error;
      }
    });
  });

  describe('Adding phases', () => {
    it('Should add a private phase with allowlist. [Phase Index 0]: Open: Not Available, Allowlist: 0.05 SOL', async () => {
      phase0Config = {
        maxMintsPerWallet: new anchor.BN(100),
        maxMintsTotal: new anchor.BN(1000),
        priceAmount: new anchor.BN(0), // Not openly buyable, only available to allowlist
        startTime: new anchor.BN(new Date().getTime() / 1000),
        endTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24), // 1 day from now
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: true,
        merkleRoot: allowListConfig.merkleRoot,
      };
      const phaseIx = await editionsControlsProgram.methods
        .addPhase(phase0Config)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      await provider.sendAndConfirm(transaction, [payer]);

      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      if (VERBOSE_LOGGING) {
        logEditionsControls(editionsControlsDecoded);
      }

      // verify state
      expect(editionsControlsDecoded.data.phases.length).to.equal(1);
    });

    it('Should add a public phase with allowlist. [Phase Index 1]: Open: O.1 SOL, Allowlist: 0.05 SOL', async () => {
      phase1Config = {
        maxMintsPerWallet: new anchor.BN(5),
        maxMintsTotal: new anchor.BN(10),
        priceAmount: new anchor.BN(1000000), // 0.1 SOL
        startTime: new anchor.BN(new Date().getTime() / 1000),
        endTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24), // 1 day from now
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: false,
        merkleRoot: allowListConfig.merkleRoot,
      };

      const phaseIx = await editionsControlsProgram.methods
        .addPhase(phase1Config)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      await provider.sendAndConfirm(transaction, [payer]);

      // get state
      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      if (VERBOSE_LOGGING) {
        logEditionsControls(editionsControlsDecoded);
      }

      // verify state
      expect(editionsControlsDecoded.data.phases.length).to.equal(2);
    });

    it('Should add a public phase without allowlist. [Phase Index 2]: Open: 0.05 SOL, Allowlist: Not Available', async () => {
      phase2Config = {
        maxMintsPerWallet: new anchor.BN(100),
        maxMintsTotal: new anchor.BN(1000),
        priceAmount: new anchor.BN(500000), // 0.05 SOL
        startTime: new anchor.BN(new Date().getTime() / 1000),
        endTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24), // 1 day from now
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: false,
        merkleRoot: null,
      };

      const phaseIx = await editionsControlsProgram.methods
        .addPhase(phase2Config)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      await provider.sendAndConfirm(transaction, [payer]);

      // get state
      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      if (VERBOSE_LOGGING) {
        logEditionsControls(editionsControlsDecoded);
      }

      // verify state
      expect(editionsControlsDecoded.data.phases.length).to.equal(3);
    });

    it('Should add a public phase without max supply, up to collection max. [Phase Index 3]', async () => {
      phase3Config = {
        maxMintsPerWallet: new anchor.BN(100),
        maxMintsTotal: new anchor.BN(0), // unlimited supply
        priceAmount: new anchor.BN(500000), // 0.05 SOL
        startTime: new anchor.BN(new Date().getTime() / 1000),
        endTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24), // 1 day from now
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: false,
        merkleRoot: null,
      };

      const phaseIx = await editionsControlsProgram.methods
        .addPhase(phase3Config)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      await provider.sendAndConfirm(transaction, [payer]);

      // get state
      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      if (VERBOSE_LOGGING) {
        logEditionsControls(editionsControlsDecoded);
      }

      // verify state
      expect(editionsControlsDecoded.data.phases.length).to.equal(4);
    });

    it('Should add a phase that starts in the future. [Phase Index 4]', async () => {
      phase4Config = {
        maxMintsPerWallet: new anchor.BN(100),
        maxMintsTotal: new anchor.BN(1000),
        priceAmount: new anchor.BN(500000), // 0.05 SOL
        startTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24), // 1 day from now
        endTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24 * 7), // 1 week from now
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: false,
        merkleRoot: null,
      };

      const phaseIx = await editionsControlsProgram.methods
        .addPhase(phase4Config)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      await provider.sendAndConfirm(transaction, [payer]);

      // get state
      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      if (VERBOSE_LOGGING) {
        logEditionsControls(editionsControlsDecoded);
      }

      // verify state
      expect(editionsControlsDecoded.data.phases.length).to.equal(5);
    });

    it('Should add a phase that has already ended. [Phase Index 5]', async () => {
      phase5Config = {
        maxMintsPerWallet: new anchor.BN(100),
        maxMintsTotal: new anchor.BN(1000),
        priceAmount: new anchor.BN(500000), // 0.05 SOL
        startTime: new anchor.BN(new Date().getTime() / 1000 - 60 * 60 * 24 * 7), // 1 week ago
        endTime: new anchor.BN(new Date().getTime() / 1000 - 60 * 60 * 24), // 1 day associatedTokenProgram
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: false,
        merkleRoot: null,
      };

      const phaseIx = await editionsControlsProgram.methods
        .addPhase(phase5Config)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      await provider.sendAndConfirm(transaction, [payer]);

      // get state
      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      if (VERBOSE_LOGGING) {
        logEditionsControls(editionsControlsDecoded);
      }

      // verify state
      expect(editionsControlsDecoded.data.phases.length).to.equal(6);
    });

    it('Should fail to add a private phase without providing the merkle root', async () => { 
      const invalidPhaseConfig = {
        maxMintsPerWallet: new anchor.BN(100),
        maxMintsTotal: new anchor.BN(1000),
        priceAmount: new anchor.BN(500000), // 0.05 SOL
        startTime: new anchor.BN(new Date().getTime() / 1000),
        endTime: new anchor.BN(new Date().getTime() / 1000 + 60 * 60 * 24), // 1 day from now
        priceToken: new PublicKey('So11111111111111111111111111111111111111112'),
        isPrivate: true,
        merkleRoot: null, // Invalid: null merkle root for private phase
      };

      const phaseIx = await editionsControlsProgram.methods
        .addPhase(invalidPhaseConfig)
        .accountsStrict({
          editionsControls: editionsControlsPda,
          creator: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          raribleEditionsProgram: editionsProgram.programId,
        })
        .signers([])
        .instruction();

      const transaction = new Transaction().add(phaseIx);
      
      try {
        await provider.sendAndConfirm(transaction, [payer]);
        // If we reach this point, the test should fail
        expect.fail('Transaction should have failed');
      } catch (error) {
        const errorString = JSON.stringify(error);
        expect(errorString).to.include('Merkle root must be provided for private phases');
      }

      // Verify state hasn't changed
      const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
      expect(editionsControlsDecoded.data.phases.length).to.equal(6); // Should still be 6 phases
    })
  });

  describe('Minting', () => {
    describe('Minting on a private allowlist-only phase [Phase Index 0]', () => {
      it('Should be able to mint with valid allowlist proof', async () => {
        const mintConfig = {
          phaseIndex: 0,
          merkleProof: allowListConfig.list[0].proof,
          allowListPrice: allowListConfig.list[0].price,
          allowListMaxClaims: allowListConfig.list[0].max_claims,
        };

        const mint = Keypair.generate();
        const member = Keypair.generate();

        const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
        const minterStatsPda = getMinterStatsPda(editionsPda, minter0.publicKey, editionsControlsProgram.programId);
        const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter0.publicKey, 0, editionsControlsProgram.programId);
        const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter0.publicKey, false, TOKEN_2022_PROGRAM_ID);

        const mintIx = await editionsControlsProgram.methods
          .mintWithControls(mintConfig)
          .accountsStrict({
            editionsDeployment: editionsPda,
            editionsControls: editionsControlsPda,
            hashlist: hashlistPda,
            hashlistMarker: hashlistMarkerPda,
            payer: minter0.publicKey,
            signer: minter0.publicKey,
            minter: minter0.publicKey,
            minterStats: minterStatsPda,
            minterStatsPhase: minterStatsPhasePda,
            mint: mint.publicKey,
            member: member.publicKey,
            group: group.publicKey,
            groupMint: groupMint.publicKey,
            platformFeeRecipient1: platformFeeAdmin.publicKey,
            tokenAccount: associatedTokenAddressSync,
            treasury: treasury.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            raribleEditionsProgram: editionsProgram.programId,
          })
          .instruction();
        const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);

        const minter0BalanceBefore = await provider.connection.getBalance(minter0.publicKey);
        const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
        const platformFeeRecipientBalanceBefore = await provider.connection.getBalance(platformFeeAdmin.publicKey);

        // Estimate transaction fee
        const estimatedFee = await estimateTransactionFee(provider.connection, transaction, [minter0, mint, member]);
        if (VERBOSE_LOGGING) {
          console.log(`Estimated transaction fee: ${estimatedFee} lamports (${estimatedFee / LAMPORTS_PER_SOL} SOL)`);
        }

        try {
          await provider.sendAndConfirm(transaction, [minter0, mint, member]);
        } catch (error) {
          console.error('Error in mintWithControls:', error);
          throw error;
        }

        // Verify state after minting
        const editionsDecoded = await getEditions(provider.connection, editionsPda, editionsProgram);
        const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
        const minterStatsDecoded = await getMinterStats(provider.connection, minterStatsPda, editionsControlsProgram);
        const minterStatsPhaseDecoded = await getMinterStats(provider.connection, minterStatsPhasePda, editionsControlsProgram);

        // Pull new balances
        const minter0BalanceAfter = await provider.connection.getBalance(minter0.publicKey);
        const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
        const platformFeeRecipientBalanceAfter = await provider.connection.getBalance(platformFeeAdmin.publicKey);

        // Verify that the token was minted
        expect(editionsDecoded.data.numberOfTokensIssued.toString()).to.equal('1');
        expect(editionsControlsDecoded.data.phases[0].currentMints.toString()).to.equal('1');
        expect(minterStatsDecoded.data.mintCount.toString()).to.equal('1');
        expect(minterStatsPhaseDecoded.data.mintCount.toString()).to.equal('1');

        // When the fee is flat, is paid by the minter.
        const expectedPlatformFee = collectionConfig.platformFee.platformFeeValue;
        const expectedTreasuryIncome = mintConfig.allowListPrice;

        if (VERBOSE_LOGGING) {
          console.log('balances before', {
            minter0: minter0BalanceBefore / LAMPORTS_PER_SOL,
            treasury: treasuryBalanceBefore / LAMPORTS_PER_SOL,
            platformFeeRecipient: platformFeeRecipientBalanceBefore / LAMPORTS_PER_SOL,
          });

          console.log('balances after', {
            minter0: minter0BalanceAfter / LAMPORTS_PER_SOL,
            treasury: treasuryBalanceAfter / LAMPORTS_PER_SOL,
            platformFeeRecipient: platformFeeRecipientBalanceAfter / LAMPORTS_PER_SOL,
          });
        }

        // Verify that the treasury received the correct amount of SOL (0.05 SOL from allowlist price)
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedTreasuryIncome.toNumber());
        // Verify that the platform fee recipient received the correct amount of royalties (0.05 SOL from collectionConfig platform fee)
        expect(platformFeeRecipientBalanceAfter - platformFeeRecipientBalanceBefore).to.equal(expectedPlatformFee.toNumber());
      });

      it('Should not be able to mint without allowlist proof (private phase)', async () => {
        const mintConfig = {
          phaseIndex: 0,
          merkleProof: null,
          allowListPrice: null,
          allowListMaxClaims: null,
        };

        const mint = Keypair.generate();
        const member = Keypair.generate();

        const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
        const minterStatsPda = getMinterStatsPda(editionsPda, minter0.publicKey, editionsControlsProgram.programId);
        const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter0.publicKey, 0, editionsControlsProgram.programId);
        const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter0.publicKey, false, TOKEN_2022_PROGRAM_ID);

        const mintIx = await editionsControlsProgram.methods
          .mintWithControls(mintConfig)
          .accountsStrict({
            editionsDeployment: editionsPda,
            editionsControls: editionsControlsPda,
            hashlist: hashlistPda,
            hashlistMarker: hashlistMarkerPda,
            payer: minter0.publicKey,
            signer: minter0.publicKey,
            minter: minter0.publicKey,
            minterStats: minterStatsPda,
            minterStatsPhase: minterStatsPhasePda,
            mint: mint.publicKey,
            member: member.publicKey,
            group: group.publicKey,
            groupMint: groupMint.publicKey,
            platformFeeRecipient1: platformFeeAdmin.publicKey,
            tokenAccount: associatedTokenAddressSync,
            treasury: treasury.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            raribleEditionsProgram: editionsProgram.programId,
          })
          .instruction();

        const transaction = new Transaction().add(mintIx);
        try {
          await provider.sendAndConfirm(transaction, [minter0, mint, member]);
        } catch (error) {
          const errorString = JSON.stringify(error);
          expect(errorString).to.include('Private phase but no merkle proof provided');
        }
      });

      it('Should fail to mint when exceeding allowlist max claims', async () => {
        const mintConfig = {
          phaseIndex: 0,
          merkleProof: allowListConfig.list[0].proof,
          allowListPrice: allowListConfig.list[0].price,
          allowListMaxClaims: allowListConfig.list[0].max_claims,
        };

        // mint twice, then the third mint should fail because the max claims for the allowlist is 3
        const mintWithControls = async () => {
          const mint = Keypair.generate();
          const member = Keypair.generate();

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter0.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter0.publicKey, 0, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter0.publicKey, false, TOKEN_2022_PROGRAM_ID);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter0.publicKey,
              signer: minter0.publicKey,
              minter: minter0.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter0, mint, member]);
          } catch (error) {
            throw error;
          }
        };

        for (let i = 0; i < 2; i++) {
          try {
            await mintWithControls();
          } catch (error) {
            throw error;
          }
        }

        try {
          await mintWithControls();
        } catch (error) {
          const errorString = JSON.stringify(error);
          expect(errorString).to.include('This wallet has exceeded allow list max_claims in the current phase.');
        }

        // expect the user to have minted three total items on the phase
        const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter0.publicKey, 0, editionsControlsProgram.programId);
        const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
        const minterStatsPhaseDecoded = await getMinterStats(provider.connection, minterStatsPhasePda, editionsControlsProgram);

        expect(editionsControlsDecoded.data.phases[0].currentMints.toString()).to.equal('3');
        expect(minterStatsPhaseDecoded.data.mintCount.toString()).to.equal('3');
      });
    });

    describe('Minting on a public phase with optional allowlist [Phase Index 1]', () => {
      it('Should be able to mint with allowlist proof at discounted price', async () => {
        const mintConfig = {
          phaseIndex: 1,
          merkleProof: allowListConfig.list[1].proof,
          allowListPrice: allowListConfig.list[1].price,
          allowListMaxClaims: allowListConfig.list[1].max_claims,
        };

        const mint = Keypair.generate();
        const member = Keypair.generate();

        const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
        const minterStatsPda = getMinterStatsPda(editionsPda, minter1.publicKey, editionsControlsProgram.programId);
        const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter1.publicKey, 1, editionsControlsProgram.programId);
        const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter1.publicKey, false, TOKEN_2022_PROGRAM_ID);

        // pull before balances
        const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
        const platformFeeRecipientBalanceBefore = await provider.connection.getBalance(platformFeeAdmin.publicKey);

        const mintIx = await editionsControlsProgram.methods
          .mintWithControls(mintConfig)
          .accountsStrict({
            editionsDeployment: editionsPda,
            editionsControls: editionsControlsPda,
            hashlist: hashlistPda,
            hashlistMarker: hashlistMarkerPda,
            payer: minter1.publicKey,
            signer: minter1.publicKey,
            minter: minter1.publicKey,
            minterStats: minterStatsPda,
            minterStatsPhase: minterStatsPhasePda,
            mint: mint.publicKey,
            member: member.publicKey,
            group: group.publicKey,
            groupMint: groupMint.publicKey,
            platformFeeRecipient1: platformFeeAdmin.publicKey,
            tokenAccount: associatedTokenAddressSync,
            treasury: treasury.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            raribleEditionsProgram: editionsProgram.programId,
          })
          .instruction();

        const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
        try {
          await provider.sendAndConfirm(transaction, [minter1, mint, member]);
        } catch (error) {
          console.error('Error in mintWithControls:', error);
          throw error;
        }

        // Verify state after minting
        const editionsDecoded = await getEditions(provider.connection, editionsPda, editionsProgram);
        const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
        const minterStatsDecoded = await getMinterStats(provider.connection, minterStatsPda, editionsControlsProgram);
        const minterStatsPhaseDecoded = await getMinterStats(provider.connection, minterStatsPhasePda, editionsControlsProgram);

        // Verify mint
        expect(editionsControlsDecoded.data.phases[1].currentMints.toString()).to.equal('1');
        expect(minterStatsDecoded.data.mintCount.toString()).to.equal('1'); // user already minted on phase 0
        expect(minterStatsPhaseDecoded.data.mintCount.toString()).to.equal('1');

        // Verify protocol fees & treasury income
        const expectedPlatformFee = collectionConfig.platformFee.platformFeeValue;
        const expectedTreasuryIncome = mintConfig.allowListPrice;

        const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
        const platformFeeRecipientBalanceAfter = await provider.connection.getBalance(platformFeeAdmin.publicKey);

        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedTreasuryIncome.toNumber());
        expect(platformFeeRecipientBalanceAfter - platformFeeRecipientBalanceBefore).to.equal(expectedPlatformFee.toNumber());
      });

      it('Should be able to mint without allowlist proof at full price', async () => {
        const mintConfig = {
          phaseIndex: 1,
          merkleProof: null,
          allowListPrice: null,
          allowListMaxClaims: null,
        };

        const mint = Keypair.generate();
        const member = Keypair.generate();

        const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
        const minterStatsPda = getMinterStatsPda(editionsPda, minter1.publicKey, editionsControlsProgram.programId);
        const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter1.publicKey, 1, editionsControlsProgram.programId);
        const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter1.publicKey, false, TOKEN_2022_PROGRAM_ID);

        // pull before balances
        const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
        const platformFeeRecipientBalanceBefore = await provider.connection.getBalance(platformFeeAdmin.publicKey);

        const mintIx = await editionsControlsProgram.methods
          .mintWithControls(mintConfig)
          .accountsStrict({
            editionsDeployment: editionsPda,
            editionsControls: editionsControlsPda,
            hashlist: hashlistPda,
            hashlistMarker: hashlistMarkerPda,
            payer: minter1.publicKey,
            signer: minter1.publicKey,
            minter: minter1.publicKey,
            minterStats: minterStatsPda,
            minterStatsPhase: minterStatsPhasePda,
            mint: mint.publicKey,
            member: member.publicKey,
            group: group.publicKey,
            groupMint: groupMint.publicKey,
            platformFeeRecipient1: platformFeeAdmin.publicKey,
            tokenAccount: associatedTokenAddressSync,
            treasury: treasury.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            raribleEditionsProgram: editionsProgram.programId,
          })
          .instruction();

        const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
        try {
          await provider.sendAndConfirm(transaction, [minter1, mint, member]);
        } catch (error) {
          console.error('Error in mintWithControls:', error);
          throw error;
        }

        // Verify state after minting
        const editionsDecoded = await getEditions(provider.connection, editionsPda, editionsProgram);
        const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
        const minterStatsDecoded = await getMinterStats(provider.connection, minterStatsPda, editionsControlsProgram);
        const minterStatsPhaseDecoded = await getMinterStats(provider.connection, minterStatsPhasePda, editionsControlsProgram);

        expect(editionsControlsDecoded.data.phases[1].currentMints.toString()).to.equal('2');
        expect(minterStatsDecoded.data.mintCount.toString()).to.equal('2');
        expect(minterStatsPhaseDecoded.data.mintCount.toString()).to.equal('2');

        // Verify protocol fees & treasury income
        const expectedPlatformFee = collectionConfig.platformFee.platformFeeValue;
        const expectedTreasuryIncome = phase1Config.priceAmount;

        const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
        const platformFeeRecipientBalanceAfter = await provider.connection.getBalance(platformFeeAdmin.publicKey);

        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedTreasuryIncome.toNumber());
        expect(platformFeeRecipientBalanceAfter - platformFeeRecipientBalanceBefore).to.equal(expectedPlatformFee.toNumber());
      });

      // Max wallet mints on Phase 1 is 5
      it('Should fail to mint when exceeding phase max per wallet', async () => {
        const mintConfig = {
          phaseIndex: 1,
          merkleProof: null,
          allowListPrice: null,
          allowListMaxClaims: null,
        };

        const mintWithControls = async () => {
          const mint = Keypair.generate();
          const member = Keypair.generate();

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter1.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter1.publicKey, 1, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter1.publicKey, false, TOKEN_2022_PROGRAM_ID);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter1.publicKey,
              signer: minter1.publicKey,
              minter: minter1.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter1, mint, member]);
          } catch (error) {
            throw error;
          }
        };

        for (let i = 0; i < 3; i++) {
          try {
            await mintWithControls();
          } catch (error) {
            throw error;
          }
        }

        // 5'th mint should fail
        try {
          await mintWithControls();
          throw new Error('Mint should fail');
        } catch (error) {
          const errorString = JSON.stringify(error);
          expect(errorString).to.include('Exceeded wallet max mints for this phase.');
        }
      });

      // Max total mints on Phase 1 is 10
      it('Should fail to mint when exceeding phase max mints', async () => {
        // phase mint count is 5, perform 5 mints more with random wallets that should succeed, then the 11th mint should fail
        const mintWithControls = async (minter: Keypair, mint: Keypair, member: Keypair) => {
          const mintConfig = {
            phaseIndex: 1,
            merkleProof: null,
            allowListPrice: null,
            allowListMaxClaims: null,
          };

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter.publicKey, 1, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter.publicKey, false, TOKEN_2022_PROGRAM_ID);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter.publicKey,
              signer: minter.publicKey,
              minter: minter.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter, mint, member]);
          } catch (error) {
            throw error;
          }
        };
        if (VERBOSE_LOGGING) {
          console.log('Performing 5 mints with random wallets, takes a while..');
        }
        const mintPromises = [];
        for (let i = 0; i < 5; i++) {
          const minter = Keypair.generate();
          const mint = Keypair.generate();
          const member = Keypair.generate();

          // airdrop minter
          const airdropTx = await provider.connection.requestAirdrop(minter.publicKey, 1 * LAMPORTS_PER_SOL);
          await provider.connection.confirmTransaction(airdropTx, 'confirmed');

          mintPromises.push(mintWithControls(minter, mint, member));
        }

        try {
          await Promise.all(mintPromises);
        } catch (error) {
          console.error('Error in parallel minting:', error);
          throw error;
        }

        // 11st mint should fail
        try {
          const minter = Keypair.generate();
          const mint = Keypair.generate();
          const member = Keypair.generate();

          // airdrop minter
          const airdropTx = await provider.connection.requestAirdrop(minter.publicKey, 1 * LAMPORTS_PER_SOL);
          await provider.connection.confirmTransaction(airdropTx, 'confirmed');

          await mintWithControls(minter, mint, member);
          throw new Error('Mint should fail');
        } catch (error) {
          const errorString = JSON.stringify(error);
          expect(errorString).to.include('Exceeded max mints for this phase.');
        }
      });

      describe('Minting on a public phase without allowlist [Phase Index 2]', () => {
        it('Should be able to mint without any allowlist data (open mint)', async () => {
          const mintConfig = {
            phaseIndex: 2,
            merkleProof: null,
            allowListPrice: null,
            allowListMaxClaims: null,
          };

          const mint = Keypair.generate();
          const member = Keypair.generate();

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter2.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter2.publicKey, 2, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter2.publicKey, false, TOKEN_2022_PROGRAM_ID);

          // pull before balances
          const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
          const platformFeeRecipientBalanceBefore = await provider.connection.getBalance(platformFeeAdmin.publicKey);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter2.publicKey,
              signer: minter2.publicKey,
              minter: minter2.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter2, mint, member]);
          } catch (error) {
            console.error('Error in mintWithControls:', error);
            throw error;
          }

          // Verify state after minting
          const editionsDecoded = await getEditions(provider.connection, editionsPda, editionsProgram);
          const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
          const minterStatsDecoded = await getMinterStats(provider.connection, minterStatsPda, editionsControlsProgram);
          const minterStatsPhaseDecoded = await getMinterStats(provider.connection, minterStatsPhasePda, editionsControlsProgram);

          expect(editionsControlsDecoded.data.phases[2].currentMints.toString()).to.equal('1');
          expect(minterStatsDecoded.data.mintCount.toString()).to.equal('1');
          expect(minterStatsPhaseDecoded.data.mintCount.toString()).to.equal('1');

          // Verify protocol fees & treasury income
          const expectedPlatformFee = collectionConfig.platformFee.platformFeeValue;
          const expectedTreasuryIncome = phase3Config.priceAmount;

          const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
          const platformFeeRecipientBalanceAfter = await provider.connection.getBalance(platformFeeAdmin.publicKey);

          expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedTreasuryIncome.toNumber());
          expect(platformFeeRecipientBalanceAfter - platformFeeRecipientBalanceBefore).to.equal(expectedPlatformFee.toNumber());
        });

        it('Should not be able to mint with allowlist (phase does not have allowlist)', async () => {
          const mintConfig = {
            phaseIndex: 2,
            merkleProof: allowListConfig.list[0].proof,
            allowListPrice: allowListConfig.list[0].price,
            allowListMaxClaims: allowListConfig.list[0].max_claims,
          };

          const mint = Keypair.generate();
          const member = Keypair.generate();

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter2.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter2.publicKey, 2, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter2.publicKey, false, TOKEN_2022_PROGRAM_ID);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter2.publicKey,
              signer: minter2.publicKey,
              minter: minter2.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter2, mint, member]);
          } catch (error) {
            const errorString = JSON.stringify(error);
            expect(errorString).to.include('Merkle root not set for allow list mint');
          }
          // get state
          const editionsDecoded = await getEditions(provider.connection, editionsPda, editionsProgram);
          const editionsControlsDecoded = await getEditionsControls(provider.connection, editionsControlsPda, editionsControlsProgram);
          const minterStatsDecoded = await getMinterStats(provider.connection, minterStatsPda, editionsControlsProgram);
          const minterStatsPhaseDecoded = await getMinterStats(provider.connection, minterStatsPhasePda, editionsControlsProgram);

          expect(editionsControlsDecoded.data.phases[2].currentMints.toString()).to.equal('1');
          expect(minterStatsDecoded.data.mintCount.toString()).to.equal('1');
          expect(minterStatsPhaseDecoded.data.mintCount.toString()).to.equal('1');

          // log final state
          if (VERBOSE_LOGGING) {
            logEditions(editionsDecoded);
            logEditionsControls(editionsControlsDecoded);
            logMinterStats(minterStatsDecoded);
            logMinterStatsPhase(minterStatsPhaseDecoded);
          }
        });
      });

      describe('Minting on a public phase without allowlist and unlimited supply up to collection max [Phase Index 3]', () => {
        // should fail to mint if it exceeds the max mints for the entire collection, max mints for the collection is 20.
        it('Should fail to mint when exceeding collection max mints', async () => {
          if (VERBOSE_LOGGING) {
            const decodedEditions = await getEditions(provider.connection, editionsPda, editionsProgram);
            logEditions(decodedEditions);
          }

          // current mint count is 14, perform 6 mints with random wallets, then the 21st mint should fail
          const mintWithControls = async (minter: Keypair, mint: Keypair, member: Keypair) => {
            const mintConfig = {
              phaseIndex: 3,
              merkleProof: null,
              allowListPrice: null,
              allowListMaxClaims: null,
            };

            const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
            const minterStatsPda = getMinterStatsPda(editionsPda, minter.publicKey, editionsControlsProgram.programId);
            const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter.publicKey, 3, editionsControlsProgram.programId);
            const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter.publicKey, false, TOKEN_2022_PROGRAM_ID);

            const mintIx = await editionsControlsProgram.methods
              .mintWithControls(mintConfig)
              .accountsStrict({
                editionsDeployment: editionsPda,
                editionsControls: editionsControlsPda,
                hashlist: hashlistPda,
                hashlistMarker: hashlistMarkerPda,
                payer: minter.publicKey,
                signer: minter.publicKey,
                minter: minter.publicKey,
                minterStats: minterStatsPda,
                minterStatsPhase: minterStatsPhasePda,
                mint: mint.publicKey,
                member: member.publicKey,
                group: group.publicKey,
                groupMint: groupMint.publicKey,
                platformFeeRecipient1: platformFeeAdmin.publicKey,
                tokenAccount: associatedTokenAddressSync,
                treasury: treasury.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                raribleEditionsProgram: editionsProgram.programId,
              })
              .instruction();

            const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
            try {
              await provider.sendAndConfirm(transaction, [minter, mint, member]);
            } catch (error) {
              throw error;
            }
          };
          if (VERBOSE_LOGGING) {
            console.log('Performing 6 mints with random wallets, takes a while..');
          }
          const mintPromises = [];
          for (let i = 0; i < 6; i++) {
            const minter = Keypair.generate();
            const mint = Keypair.generate();
            const member = Keypair.generate();

            // airdrop minter
            const airdropTx = await provider.connection.requestAirdrop(minter.publicKey, 1 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropTx, 'confirmed');

            mintPromises.push(mintWithControls(minter, mint, member));
          }

          try {
            await Promise.all(mintPromises);
          } catch (error) {
            console.error('Error in parallel minting:', error);
            throw error;
          }
          if (VERBOSE_LOGGING) {
            console.log('Performing 21th mint with random wallet..');
          }
          try {
            const minter = Keypair.generate();
            const mint = Keypair.generate();
            const member = Keypair.generate();

            // airdrop minter
            const airdropTx = await provider.connection.requestAirdrop(minter.publicKey, 1 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropTx, 'confirmed');

            await mintWithControls(minter, mint, member);
            throw new Error('Mint should fail');
          } catch (error) {
            const errorString = JSON.stringify(error);
            expect(errorString).to.include('Minted out.');
          }
        });
      });

      describe('Attempting to mint on invalid phases', () => {
        it('Should fail to mint on a phase that has not started yet', async () => {
          const mintConfig = {
            phaseIndex: 4,
            merkleProof: null,
            allowListPrice: null,
            allowListMaxClaims: null,
          };

          const minter = Keypair.generate();
          const mint = Keypair.generate();
          const member = Keypair.generate();

          // airdrop minter
          const airdropTx = await provider.connection.requestAirdrop(minter.publicKey, 1 * LAMPORTS_PER_SOL);
          await provider.connection.confirmTransaction(airdropTx, 'confirmed');

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter.publicKey, 4, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter.publicKey, false, TOKEN_2022_PROGRAM_ID);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter.publicKey,
              signer: minter.publicKey,
              minter: minter.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter, mint, member]);
          } catch (error) {
            const errorString = JSON.stringify(error);
            expect(errorString).to.include('Phase not yet started');
          }
        });

        it('Should fail to mint on a phase that has already ended', async () => {
          const mintConfig = {
            phaseIndex: 5,
            merkleProof: null,
            allowListPrice: null,
            allowListMaxClaims: null,
          };

          const minter = Keypair.generate();
          const mint = Keypair.generate();
          const member = Keypair.generate();

          // airdrop minter
          const airdropTx = await provider.connection.requestAirdrop(minter.publicKey, 1 * LAMPORTS_PER_SOL);
          await provider.connection.confirmTransaction(airdropTx, 'confirmed');

          const hashlistMarkerPda = getHashlistMarkerPda(editionsPda, mint.publicKey, editionsProgram.programId);
          const minterStatsPda = getMinterStatsPda(editionsPda, minter.publicKey, editionsControlsProgram.programId);
          const minterStatsPhasePda = getMinterStatsPhasePda(editionsPda, minter.publicKey, 5, editionsControlsProgram.programId);
          const associatedTokenAddressSync = getAssociatedTokenAddressSync(mint.publicKey, minter.publicKey, false, TOKEN_2022_PROGRAM_ID);

          const mintIx = await editionsControlsProgram.methods
            .mintWithControls(mintConfig)
            .accountsStrict({
              editionsDeployment: editionsPda,
              editionsControls: editionsControlsPda,
              hashlist: hashlistPda,
              hashlistMarker: hashlistMarkerPda,
              payer: minter.publicKey,
              signer: minter.publicKey,
              minter: minter.publicKey,
              minterStats: minterStatsPda,
              minterStatsPhase: minterStatsPhasePda,
              mint: mint.publicKey,
              member: member.publicKey,
              group: group.publicKey,
              groupMint: groupMint.publicKey,
              platformFeeRecipient1: platformFeeAdmin.publicKey,
              tokenAccount: associatedTokenAddressSync,
              treasury: treasury.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              groupExtensionProgram: TOKEN_GROUP_EXTENSION_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              raribleEditionsProgram: editionsProgram.programId,
            })
            .instruction();

          const transaction = new Transaction().add(modifiedComputeUnits).add(mintIx);
          try {
            await provider.sendAndConfirm(transaction, [minter, mint, member]);
          } catch (error) {
            const errorString = JSON.stringify(error);
            expect(errorString).to.include('Phase already finished');
          }
        });
      });
    });
  });
});
