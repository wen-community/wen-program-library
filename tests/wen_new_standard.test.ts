import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { expect } from "chai";
import { faker } from "@faker-js/faker";
import { WenNewStandard } from "../target/types/wen_new_standard";

import {
  Keypair,
  AccountInfo,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  getAccount,
  getMetadataPointerState,
  Mint,
  Account,
  MetadataPointer,
  getTokenMetadata,
  createApproveCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import {
  Field,
  TokenMetadata,
  createUpdateFieldInstruction,
} from "@solana/spl-token-metadata";
import {
  MANAGER_SEED,
  getMinRentForWNSMint,
  sendAndConfirmWNSTransaction,
  getExtraMetasAccountPda,
  getApproveAccountPda,
  GROUP_ACCOUNT_SEED,
  MEMBER_ACCOUNT_SEED,
} from "./utils";

describe("wen_new_standard", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const { connection, wallet } = provider;

  const program = anchor.workspace.WenNewStandard as Program<WenNewStandard>;
  const wnsProgramId = program.programId;
  const payer = wallet.publicKey;

  const [manager] = anchor.web3.PublicKey.findProgramAddressSync(
    [MANAGER_SEED],
    program.programId
  );

  before(async () => {
    await program.methods.initManagerAccount().rpc();
  });

  describe("manager", () => {
    describe("after initializing", () => {
      let account: AccountInfo<Buffer>;

      before(async () => {
        account = await program.account.manager.getAccountInfo(manager);
      });

      it("should exist with a fixed seed", async () => {
        expect(account.data).to.eql(Buffer.from([221, 78, 171, 233, 213, 142, 113, 56]));
      });

      it("should be owned by the program", async () => {
        expect(account.owner).to.eql(program.programId);
      });
    });
  });

  describe("mint", () => {
    const mintKeyPair = Keypair.generate();
    const receiver = Keypair.generate();

    const mintAuthPublicKey = wallet.publicKey;
    const mintPublicKey = mintKeyPair.publicKey;
    const mintTokenAccount = getAssociatedTokenAddressSync(
      mintPublicKey,
      mintAuthPublicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const receiverTokenAccount = getAssociatedTokenAddressSync(
      mintPublicKey,
      receiver.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    describe("after creating", () => {
      let mintAccount: Mint;
      let mintAccountInfo: AccountInfo<Buffer>;
      let metadataPointer: Partial<MetadataPointer> | null;
      let metadata: TokenMetadata;

      const name = faker.lorem.words({ max: 3, min: 2 });
      const symbol = faker.lorem.word();
      const uri = faker.internet.url();

      before(async () => {
        await program.methods
          .createMintAccount({
            permanentDelegate: null,
            name,
            symbol,
            uri,
          })
          .accountsStrict({
            authority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            payer: mintAuthPublicKey,
            receiver: mintAuthPublicKey,
            manager,

            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .signers([mintKeyPair])
          .rpc({
            skipPreflight: true,
            preflightCommitment: "confirmed",
            commitment: "confirmed",
          });

        // getAccountInfo
        mintAccountInfo = await connection.getAccountInfo(mintPublicKey);
        mintAccount = await getMint(
          connection,
          mintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        metadataPointer = getMetadataPointerState(mintAccount);
        metadata = await getTokenMetadata(
          connection,
          mintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      });

      it("should be owned by the token extensions program", async () => {
        expect(mintAccountInfo.owner).to.eql(TOKEN_2022_PROGRAM_ID);
      });

      it("should have metadata pointer", async () => {
        expect(metadataPointer.metadataAddress).to.eql(mintPublicKey);
      });

      it("should have right name set", async () => {
        expect(metadata.name).to.eql(name);
      });

      it("should have right symbol set", async () => {
        expect(metadata.symbol).to.eql(symbol);
      });

      it("should have right uri set", async () => {
        expect(metadata.uri).to.eql(uri);
      });
    });

    describe("after updating", () => {
      const newName = faker.lorem.words({ max: 5, min: 5 });
      let metadata: TokenMetadata;

      before(async () => {
        metadata = await getTokenMetadata(
          connection,
          mintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        metadata.name = newName;

        const instructions: TransactionInstruction[] = [];
        const rent = await getMinRentForWNSMint(connection, metadata, "member");
        const currentRent = await connection.getBalance(mintPublicKey, "confirmed");

        if (currentRent < rent) {
          const lamportsDiff = rent - currentRent;
          instructions.push(
            SystemProgram.transfer({
              fromPubkey: mintAuthPublicKey,
              toPubkey: mintPublicKey,
              lamports: lamportsDiff,
            })
          );
        }

        instructions.push(
          createUpdateFieldInstruction({
            field: Field.Name,
            metadata: mintPublicKey,
            programId: TOKEN_2022_PROGRAM_ID,
            updateAuthority: mintAuthPublicKey,
            value: newName,
          })
        );

        await sendAndConfirmWNSTransaction(connection, instructions, provider);

        metadata = await getTokenMetadata(
          connection,
          mintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      });
      it("should have updated name", async () => {
        expect(metadata.name).to.eql(newName);
      });
    });

    describe("after adding royalties", () => {
      const creator1 = Keypair.generate();
      const creator2 = Keypair.generate();

      const extraMetasAccount = getExtraMetasAccountPda(mintPublicKey, wnsProgramId);

      let metadata: TokenMetadata | null;

      let royaltyBasisPoints: [string, string] | undefined;
      let creator1Data: [string, string] | undefined;
      let creator2Data: [string, string] | undefined;

      before(async () => {
        await program.methods
          .addRoyalties({
            creators: [
              { address: creator1.publicKey, share: 20 },
              { address: creator2.publicKey, share: 80 },
            ],
            royaltyBasisPoints: 500,
          })
          .accountsStrict({
            authority: mintAuthPublicKey,
            mint: mintPublicKey,
            payer: mintAuthPublicKey,
            extraMetasAccount,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc({
            skipPreflight: true,
            preflightCommitment: "confirmed",
            commitment: "confirmed",
          });

        metadata = await getTokenMetadata(
          connection,
          mintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );

        royaltyBasisPoints = metadata?.additionalMetadata.find(
          ([m]) => m === "royalty_basis_points"
        );

        creator1Data = metadata?.additionalMetadata.find(
          ([m]) => m === creator1.publicKey.toString()
        );

        creator2Data = metadata?.additionalMetadata.find(
          ([m]) => m === creator2.publicKey.toString()
        );
      });

      it("should contain seller fee basis points", async () => {
        expect(royaltyBasisPoints).not.to.undefined;
        expect(royaltyBasisPoints[1]).to.eql("500");
      });

      it("should contain creators and their shares", async () => {
        expect(creator1Data).not.to.undefined;
        expect(creator1Data[1]).to.eql("20");
        expect(creator2Data).not.to.undefined;
        expect(creator2Data[1]).to.eql("80");
      });
    });

    describe("after freezing", () => {
      let mintTokenAccountData: Account;

      before(async () => {
        await program.methods
          .freezeMintAccount()
          .accountsStrict({
            delegateAuthority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            user: mintAuthPublicKey,
            manager,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .preInstructions([
            createApproveCheckedInstruction(
              mintTokenAccount,
              mintPublicKey,
              mintAuthPublicKey,
              mintAuthPublicKey,
              1,
              0,
              [],
              TOKEN_2022_PROGRAM_ID
            ),
          ])
          .rpc({
            skipPreflight: true,
            preflightCommitment: "confirmed",
            commitment: "confirmed",
          });

        mintTokenAccountData = await getAccount(
          connection,
          mintTokenAccount,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      });

      it("should be frozen", async () => {
        expect(mintTokenAccountData.isFrozen).to.be.true;
      });

      describe("trying to transfer", () => {
        let logs: string[];

        before(async () => {
          const transferIx = createTransferCheckedInstruction(
            mintTokenAccount,
            mintPublicKey,
            receiverTokenAccount,
            mintAuthPublicKey,
            1,
            0,
            [],
            TOKEN_2022_PROGRAM_ID
          );

          transferIx.keys.push(
            {
              pubkey: getApproveAccountPda(mintPublicKey, wnsProgramId),
              isSigner: false,
              isWritable: true,
            },
            { pubkey: wnsProgramId, isSigner: false, isWritable: false },
            {
              pubkey: getExtraMetasAccountPda(mintPublicKey, wnsProgramId),
              isSigner: false,
              isWritable: false,
            }
          );

          const instructions = [
            createAssociatedTokenAccountInstruction(
              mintAuthPublicKey,
              receiverTokenAccount,
              receiver.publicKey,
              mintPublicKey,
              TOKEN_2022_PROGRAM_ID
            ),
            transferIx,
          ];

          try {
            await sendAndConfirmWNSTransaction(connection, instructions, provider, false);
          } catch (err) {
            logs = err.logs;
          }
        });

        it("should be blocked", async () => {
          expect(logs).not.to.be.undefined;
        });
      });
    });

    describe("after thawing", () => {
      let mintTokenAccountData: Account;

      before(async () => {
        await program.methods
          .thawMintAccount()
          .accountsStrict({
            delegateAuthority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            user: mintAuthPublicKey,
            manager,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .rpc({
            skipPreflight: true,
            preflightCommitment: "confirmed",
            commitment: "confirmed",
          });

        mintTokenAccountData = await getAccount(
          connection,
          mintTokenAccount,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      });

      it("should be thawed", async () => {
        expect(mintTokenAccountData.isFrozen).to.be.false;
      });

      describe("trying to transfer", () => {
        let receiverTokenAccountData: Account;
        before(async () => {
          const signature = await connection.requestAirdrop(
            receiver.publicKey,
            1 * LAMPORTS_PER_SOL
          );

          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
            "confirmed"
          );

          await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
          });

          const transferIx = createTransferCheckedInstruction(
            mintTokenAccount,
            mintPublicKey,
            receiverTokenAccount,
            mintAuthPublicKey,
            1,
            0,
            [],
            TOKEN_2022_PROGRAM_ID
          );

          transferIx.keys.push(
            {
              pubkey: getApproveAccountPda(mintPublicKey, wnsProgramId),
              isSigner: false,
              isWritable: true,
            },
            { pubkey: wnsProgramId, isSigner: false, isWritable: false },
            {
              pubkey: getExtraMetasAccountPda(mintPublicKey, wnsProgramId),
              isSigner: false,
              isWritable: false,
            }
          );

          const instructions = [
            createAssociatedTokenAccountInstruction(
              mintAuthPublicKey,
              receiverTokenAccount,
              receiver.publicKey,
              mintPublicKey,
              TOKEN_2022_PROGRAM_ID
            ),
            transferIx,
          ];

          await sendAndConfirmWNSTransaction(connection, instructions, provider);

          receiverTokenAccountData = await getAccount(
            connection,
            receiverTokenAccount,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
          );
        });

        it("should be allowed", async () => {
          expect(receiverTokenAccountData.amount.toString()).to.eql("1");
        });

        it("should be owned by the new owner", async () => {
          expect(receiverTokenAccountData.owner).to.eql(receiver.publicKey);
        });
      });
    });

    describe("after burning", () => {
      let tokenAccountInfo: AccountInfo<Buffer>;
      let tokenAccountLamports: number;

      let mintAccountInfo: AccountInfo<Buffer>;
      let mintAccountLamports: number;

      let totalBurnRent: number;
      let payerPreBurnBalance: number;
      let payerPostBurnBalance: number;

      before(async () => {
        payerPreBurnBalance = await connection.getBalance(
          receiver.publicKey,
          "confirmed"
        );

        totalBurnRent =
          (await connection.getBalance(receiverTokenAccount, "confirmed")) +
          (await connection.getBalance(mintPublicKey, "confirmed"));

        const burnIx = await program.methods
          .burnMintAccount()
          .accountsStrict({
            mint: mintPublicKey,
            mintTokenAccount: receiverTokenAccount,
            payer: receiver.publicKey,
            user: receiver.publicKey,
            manager,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .instruction();

        const instructions = [burnIx];
        await sendAndConfirmWNSTransaction(connection, instructions, provider, true, [
          receiver,
        ]);

        tokenAccountInfo = await connection.getAccountInfo(
          receiverTokenAccount,
          "confirmed"
        );
        mintAccountInfo = await connection.getAccountInfo(mintPublicKey, "confirmed");

        tokenAccountLamports = await connection.getBalance(
          receiverTokenAccount,
          "confirmed"
        );
        mintAccountLamports = await connection.getBalance(mintPublicKey, "confirmed");

        payerPostBurnBalance = await connection.getBalance(
          receiver.publicKey,
          "confirmed"
        );
      });

      it("should have no rent", async () => {
        expect(tokenAccountLamports).to.eql(0);
        expect(mintAccountLamports).to.eql(0);
      });
      it("should have no data", async () => {
        expect(tokenAccountInfo).to.be.null;
        expect(mintAccountInfo).to.be.null;
      });
      it("should credit rent to payer", async () => {
        expect(payerPostBurnBalance).to.eql(payerPreBurnBalance + totalBurnRent);
      });
    });
  });

  describe("group", () => {
    const groupAuthorityKeyPair = Keypair.generate();
    const groupAuthorityPublicKey = groupAuthorityKeyPair.publicKey;

    const groupMintKeyPair = Keypair.generate();
    const groupMintPublicKey = groupMintKeyPair.publicKey;

    const mintKeyPair = Keypair.generate();
    const mintPublicKey = mintKeyPair.publicKey;

    const [group] = PublicKey.findProgramAddressSync(
      [GROUP_ACCOUNT_SEED, groupMintPublicKey.toBuffer()],
      program.programId
    );

    let createGroupArgs;
    let groupAccountInfo: AccountInfo<Buffer>;
    let groupAccount;

    before(async () => {
      createGroupArgs = {
        name: faker.lorem.text(),
        symbol: faker.lorem.word(),
        uri: faker.internet.url(),
        maxSize: 1,
      };

      const mintTokenAccount = getAssociatedTokenAddressSync(
        groupMintPublicKey,
        groupAuthorityPublicKey,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .createGroupAccount(createGroupArgs)
        .accountsStrict({
          mintTokenAccount,
          mint: groupMintPublicKey,
          authority: groupAuthorityPublicKey,
          receiver: groupAuthorityPublicKey,
          group,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          payer,
          manager,
          systemProgram: SystemProgram.programId,
        })
        .signers([groupMintKeyPair, groupAuthorityKeyPair])
        .rpc({
          skipPreflight: true,
          preflightCommitment: "confirmed",
          commitment: "confirmed",
        });

      groupAccountInfo = await program.account.tokenGroup.getAccountInfo(group);
      groupAccount = program.coder.accounts.decode("tokenGroup", groupAccountInfo.data);
    });

    describe("after creating", () => {
      it("should be an account owned by the program", async () => {
        expect(groupAccountInfo.owner).to.eql(program.programId);
      });

      it("should have an update authority", async () => {
        expect(groupAccount.updateAuthority).to.eql(groupAuthorityPublicKey);
      });

      it("should reference the group mint", async () => {
        expect(groupAccount.mint).to.eql(groupMintPublicKey);
      });

      it("should have a max size", async () => {
        expect(groupAccount.maxSize).to.eql(createGroupArgs.maxSize);
      });

      it("should have no members denoted by a size of 0", async () => {
        expect(groupAccount.size).to.eql(0);
      });
    });

    describe("after updating", () => {
      const newName = faker.lorem.words({ max: 5, min: 5 });
      let metadata: TokenMetadata;

      before(async () => {
        metadata = await getTokenMetadata(
          connection,
          groupMintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        metadata.name = newName;

        const instructions: TransactionInstruction[] = [];
        const rent = await getMinRentForWNSMint(connection, metadata, "member");
        const currentRent = await connection.getBalance(groupMintPublicKey, "confirmed");

        if (currentRent < rent) {
          const lamportsDiff = rent - currentRent;
          instructions.push(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: groupMintPublicKey,
              lamports: lamportsDiff,
            })
          );
        }

        instructions.push(
          createUpdateFieldInstruction({
            field: Field.Name,
            metadata: groupMintPublicKey,
            programId: TOKEN_2022_PROGRAM_ID,
            updateAuthority: groupAuthorityPublicKey,
            value: newName,
          })
        );

        await sendAndConfirmWNSTransaction(connection, instructions, provider, true, [
          groupAuthorityKeyPair,
        ]);

        metadata = await getTokenMetadata(
          connection,
          groupMintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      });
      it("should have updated name", async () => {
        expect(metadata.name).to.eql(newName);
      });
    });

    describe("after adding a mint as a member", () => {
      const mintAuthPublicKey = wallet.publicKey;
      const mintTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        mintAuthPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const [member] = PublicKey.findProgramAddressSync(
        [MEMBER_ACCOUNT_SEED, mintPublicKey.toBuffer()],
        program.programId
      );

      let memberAccountInfo: AccountInfo<Buffer>;
      let memberAccount;

      describe("the mint", () => {
        before(async () => {
          const createMintAccountIx = await program.methods
            .createMintAccount({
              permanentDelegate: null,
              name: faker.lorem.text(),
              symbol: faker.lorem.word(),
              uri: faker.internet.url(),
            })
            .accountsStrict({
              authority: mintAuthPublicKey,
              mint: mintPublicKey,
              mintTokenAccount,
              payer: mintAuthPublicKey,
              receiver: mintAuthPublicKey,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              manager,
  
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .instruction();

          await program.methods
            .addMintToGroup()
            .accountsStrict({
              authority: groupAuthorityPublicKey,
              group,
              mint: mintPublicKey,
              payer: mintAuthPublicKey,
              manager,
              member,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .preInstructions([createMintAccountIx])
            .signers([mintKeyPair, groupAuthorityKeyPair])
            .rpc({
              skipPreflight: true,
              preflightCommitment: "confirmed",
              commitment: "confirmed",
            });

          memberAccountInfo = await program.account.tokenGroupMember.getAccountInfo(
            member
          );
          memberAccount = program.coder.accounts.decode(
            "tokenGroupMember",
            memberAccountInfo.data
          );
        });

        it("should be an account owned by the program", async () => {
          expect(memberAccountInfo.owner).to.eql(program.programId);
        });
        it("should point back to the group", async () => {
          expect(memberAccount.group).to.eql(group);
        });
        it("should have the right member number", async () => {
          expect(memberAccount.memberNumber.toString()).to.eql("1");
        });
        it("should have the right member mint", async () => {
          expect(memberAccount.mint).to.eql(mintPublicKey);
        });
      });

      describe("the group", () => {
        let groupAccount;
        before(async () => {
          groupAccount = await program.account.tokenGroup.fetch(group, "confirmed");
        });
        it("should be a size of 1", async () => {
          expect(groupAccount.size).to.eql(1);
        });
      });
    });

    describe("after trying to add another mint as a member", () => {
      const mintKeyPair = Keypair.generate();

      const mintAuthPublicKey = wallet.publicKey;
      const mintPublicKey = mintKeyPair.publicKey;
      const mintTokenAccount = getAssociatedTokenAddressSync(
        mintPublicKey,
        mintAuthPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const [member] = PublicKey.findProgramAddressSync(
        [MEMBER_ACCOUNT_SEED, mintPublicKey.toBuffer()],
        program.programId
      );
      let logs: string[];
      let errorCode: { code: string; number: number };

      before(async () => {
        const createMintAccountIx = await program.methods
          .createMintAccount({
            permanentDelegate: null,
            name: faker.lorem.text(),
            symbol: faker.lorem.word(),
            uri: faker.internet.url(),
          })
          .accountsStrict({
            authority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            payer: mintAuthPublicKey,
            receiver: mintAuthPublicKey,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            manager,

            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .instruction();

        try {
          await program.methods
            .addMintToGroup()
            .accountsStrict({
              authority: groupAuthorityPublicKey,
              group,
              mint: mintPublicKey,
              payer: mintAuthPublicKey,
              manager,
              member,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .preInstructions([createMintAccountIx])
            .signers([mintKeyPair, groupAuthorityKeyPair])
            .rpc({
              skipPreflight: true,
              preflightCommitment: "confirmed",
              commitment: "confirmed",
            });
        } catch (err) {
          logs = err.logs;
          errorCode = err.error.errorCode;
        }
      });
      describe("the mint", () => {
        it("should be blocked", async () => {
          expect(logs).not.to.be.undefined;
        });
      });

      describe("the group", () => {
        it("should have correct errorCode", async () => {
          expect(errorCode.number).to.eql(6000);
          expect(errorCode.code).to.eql("SizeExceedsMaxSize");
        });
      });
    });

    describe("after removing mint as a member", () => {
      const mintAuthPublicKey = wallet.publicKey;
      const [member] = PublicKey.findProgramAddressSync(
        [MEMBER_ACCOUNT_SEED, mintPublicKey.toBuffer()],
        program.programId
      );

      let memberAccountInfo: AccountInfo<Buffer>;
      describe("the mint", () => {
        before(async () => {
          await program.methods
            .removeMintFromGroup()
            .accountsStrict({
              authority: groupAuthorityPublicKey,
              group,
              mint: mintPublicKey,
              payer: mintAuthPublicKey,
              manager,
              member,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([groupAuthorityKeyPair])
            .rpc({
              skipPreflight: true,
              preflightCommitment: "confirmed",
              commitment: "confirmed",
            });

          memberAccountInfo = await program.account.tokenGroupMember.getAccountInfo(
            member
          );
        });
        it("should not point back to the group", async () => {
          expect(memberAccountInfo).to.be.null;
        });
      });

      describe("the group", () => {
        let groupAccount;
        before(async () => {
          groupAccount = await program.account.tokenGroup.fetch(group, "confirmed");
        });
        it("should be a size of 0", async () => {
          expect(groupAccount.size).to.eql(0);
        });
      });
    });
  });
});
