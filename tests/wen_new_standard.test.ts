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
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
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
  TokenMetadata,
  createUpdateFieldInstruction,
} from "@solana/spl-token-metadata";
import {
  getApproveAccountPda,
  getExtraMetasAccountPda,
  wnsProgramId,
} from "../clients/wns-sdk/src";

const MANAGER_SEED = Buffer.from("manager");
const GROUP_ACCOUNT_SEED = Buffer.from("group");
const MEMBER_ACCOUNT_SEED = Buffer.from("member");

describe("wen_new_standard", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.WenNewStandard as Program<WenNewStandard>;
  const payer = provider.wallet.publicKey;

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
        expect(account.data).to.eql(
          Buffer.from([221, 78, 171, 233, 213, 142, 113, 56])
        );
      });

      it("should be owned by the program", async () => {
        expect(account.owner).to.eql(program.programId);
      });
    });
  });

  describe("mint", () => {
    const mintKeyPair = Keypair.generate();
    const receiver = Keypair.generate();

    const mintAuthPublicKey = provider.wallet.publicKey;
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

      before(async () => {
        await program.methods
          .createMintAccount({
            permanentDelegate: null,
            name: faker.lorem.text(),
            symbol: faker.lorem.word(),
            uri: faker.internet.url(),
          })
          .accounts({
            authority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            payer: mintAuthPublicKey,
            receiver: mintAuthPublicKey,
          })
          .signers([mintKeyPair])
          .rpc({
            skipPreflight: true,
            preflightCommitment: "confirmed",
            commitment: "confirmed",
          });

        // getAccountInfo
        mintAccountInfo = await provider.connection.getAccountInfo(
          mintPublicKey
        );
        mintAccount = await getMint(
          provider.connection,
          mintPublicKey,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        metadataPointer = getMetadataPointerState(mintAccount);
      });

      it("should be owned by the token extensions program", async () => {
        expect(mintAccountInfo.owner).to.eql(TOKEN_2022_PROGRAM_ID);
      });

      it("should have metadata pointer", async () => {
        expect(metadataPointer.metadataAddress).to.eql(mintPublicKey);
      });
    });

    describe("after updating", () => {
      before(async () => {});
      it.skip("should have updated title", async () => {});
    });

    describe("after adding royalties", () => {
      const creator1 = Keypair.generate();
      const creator2 = Keypair.generate();

      const extraMetasAccount = getExtraMetasAccountPda(
        mintPublicKey.toString()
      );

      let metadata: TokenMetadata | null;

      let royaltyBasisPoints: [string, string] | undefined;
      let creator1Data: [string, string] | undefined;
      let creator2Data: [string, string] | undefined;

      before(async () => {
        await program.methods
          .addRoyalties({
            creators: [
              { address: creator1.publicKey, share: 50 },
              { address: creator2.publicKey, share: 50 },
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
          provider.connection,
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
        expect(creator1Data[1]).to.eql("50");
        expect(creator2Data).not.to.undefined;
        expect(creator2Data[1]).to.eql("50");
      });
      // it.skip("should have wen_royalty_distribution extension registered", async () => {});
    });

    describe("after freezing", () => {
      let mintTokenAccountData: Account;

      before(async () => {
        await program.methods
          .freezeMintAccount()
          .accounts({
            delegateAuthority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            payer: mintAuthPublicKey,
            user: mintAuthPublicKey,
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
          provider.connection,
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
          const transaction = new VersionedTransaction(
            new TransactionMessage({
              instructions: [
                createAssociatedTokenAccountInstruction(
                  mintAuthPublicKey,
                  receiverTokenAccount,
                  receiver.publicKey,
                  mintPublicKey,
                  TOKEN_2022_PROGRAM_ID
                ),
                createTransferCheckedInstruction(
                  mintTokenAccount,
                  mintPublicKey,
                  receiverTokenAccount,
                  mintAuthPublicKey,
                  1,
                  0,
                  [],
                  TOKEN_2022_PROGRAM_ID
                ),
              ],
              payerKey: mintAuthPublicKey,
              recentBlockhash: (
                await provider.connection.getLatestBlockhash("confirmed")
              ).blockhash,
            }).compileToV0Message()
          );

          const signedTx = await provider.wallet.signTransaction(transaction);
          try {
            await provider.connection.confirmTransaction({
              ...(await provider.connection.getLatestBlockhash("confirmed")),
              signature: await provider.connection.sendTransaction(signedTx),
            });
          } catch (err) {
            logs = [
              err.logs.find(
                (log: string) => log === "Program log: Error: Account is frozen"
              ),
            ];
          }
        });

        it("should be blocked", async () => {
          expect(logs).not.to.be.undefined;
          expect(logs).to.eql(["Program log: Error: Account is frozen"]);
        });
      });
    });

    describe("after thawing", () => {
      let mintTokenAccountData: Account;

      before(async () => {
        await program.methods
          .thawMintAccount()
          .accounts({
            delegateAuthority: mintAuthPublicKey,
            mint: mintPublicKey,
            mintTokenAccount,
            payer: mintAuthPublicKey,
            user: mintAuthPublicKey,
          })
          .rpc({
            skipPreflight: true,
            preflightCommitment: "confirmed",
            commitment: "confirmed",
          });

        mintTokenAccountData = await getAccount(
          provider.connection,
          mintTokenAccount,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
      });

      it.skip("should be thawed", async () => {
        expect(mintTokenAccountData.isFrozen).to.be.false;
      });

      describe("trying to transfer", () => {
        let receiverTokenAccountData: Account;
        before(async () => {
          await provider.connection.confirmTransaction({
            ...(await provider.connection.getLatestBlockhash("confirmed")),
            signature: await provider.connection.requestAirdrop(
              receiver.publicKey,
              1 * LAMPORTS_PER_SOL
            ),
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
              pubkey: getApproveAccountPda(mintPublicKey.toString()),
              isSigner: false,
              isWritable: true,
            },
            { pubkey: wnsProgramId, isSigner: false, isWritable: false },
            {
              pubkey: getExtraMetasAccountPda(mintPublicKey.toString()),
              isSigner: false,
              isWritable: false,
            }
          );

          const transaction = new VersionedTransaction(
            new TransactionMessage({
              instructions: [
                createAssociatedTokenAccountInstruction(
                  mintAuthPublicKey,
                  receiverTokenAccount,
                  receiver.publicKey,
                  mintPublicKey,
                  TOKEN_2022_PROGRAM_ID
                ),
                transferIx,
              ],
              payerKey: mintAuthPublicKey,
              recentBlockhash: (
                await provider.connection.getLatestBlockhash("confirmed")
              ).blockhash,
            }).compileToV0Message()
          );

          const signedTx = await provider.wallet.signTransaction(transaction);
          await provider.connection.confirmTransaction(
            {
              ...(await provider.connection.getLatestBlockhash("confirmed")),
              signature: await provider.connection.sendTransaction(signedTx, {
                preflightCommitment: "confirmed",
                skipPreflight: true,
              }),
            },
            "confirmed"
          );

          receiverTokenAccountData = await getAccount(
            provider.connection,
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

      before(async () => {
        const transferIx = createTransferCheckedInstruction(
          receiverTokenAccount,
          mintPublicKey,
          mintTokenAccount,
          receiver.publicKey,
          1,
          0,
          [],
          TOKEN_2022_PROGRAM_ID
        );

        transferIx.keys.push(
          {
            pubkey: getApproveAccountPda(mintPublicKey.toString()),
            isSigner: false,
            isWritable: true,
          },
          { pubkey: wnsProgramId, isSigner: false, isWritable: false },
          {
            pubkey: getExtraMetasAccountPda(mintPublicKey.toString()),
            isSigner: false,
            isWritable: false,
          }
        );

        await program.methods
          .burnMintAccount()
          .accounts({
            mint: mintPublicKey,
            mintTokenAccount,
            payer: mintAuthPublicKey,
            user: mintAuthPublicKey,
          })
          .preInstructions([transferIx])
          .signers([receiver])
          .rpc({
            commitment: "confirmed",
            skipPreflight: true,
            preflightCommitment: "confirmed",
          });
        tokenAccountInfo = await provider.connection.getAccountInfo(
          mintTokenAccount,
          "confirmed"
        );

        tokenAccountLamports = await provider.connection.getBalance(
          mintTokenAccount
        );
      });
      it.skip("should be burnt", async () => {});
      it.skip("should be owned by the system program", async () => {});
      it("should have no rent", async () => {
        expect(tokenAccountLamports).to.eql(0);
      });
      it("should have no data", async () => {
        expect(tokenAccountInfo).to.be.null;
      });
    });
  });

  describe("group", () => {
    const groupAuthorityKeyPair = Keypair.generate();
    const groupAuthorityPublicKey = groupAuthorityKeyPair.publicKey;

    const groupMintKeyPair = Keypair.generate();
    const groupMintPublicKey = groupMintKeyPair.publicKey;

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
        maxSize: faker.number.int({ min: 1, max: 1_000_000 }),
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
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([groupMintKeyPair, groupAuthorityKeyPair])
        .rpc({
          skipPreflight: true,
          preflightCommitment: "confirmed",
          commitment: "confirmed",
        });

      groupAccountInfo = await program.account.tokenGroup.getAccountInfo(group);
      groupAccount = program.coder.accounts.decode(
        "tokenGroup",
        groupAccountInfo.data
      );
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

    describe("after updating", () => {});

    describe("after adding a mint as a member", () => {
      const mintKeyPair = Keypair.generate();

      const mintAuthPublicKey = provider.wallet.publicKey;
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
            .accounts({
              authority: mintAuthPublicKey,
              mint: mintPublicKey,
              mintTokenAccount,
              payer: mintAuthPublicKey,
              receiver: mintAuthPublicKey,
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

          memberAccountInfo =
            await program.account.tokenGroupMember.getAccountInfo(member);
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
      });

      describe("the group", () => {
        let groupAccount;
        before(async () => {
          groupAccount = await program.account.tokenGroup.fetch(
            group,
            "confirmed"
          );
        });
        it("should be a size of 1", async () => {
          expect(groupAccount.size).to.eql(1);
        });
      });
    });

    describe.skip("after removing mint as a member", () => {
      describe("the mint", () => {
        it.skip("should not point back to the group", async () => {});
      });

      describe("the group", () => {
        it.skip("should have a size of 0", async () => {});
      });
    });
  });
});
