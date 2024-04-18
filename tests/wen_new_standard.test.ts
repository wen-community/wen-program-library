import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { faker } from "@faker-js/faker";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { WenNewStandard } from "../target/types/wen_new_standard";

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
      let account: anchor.web3.AccountInfo<Buffer>;

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
    const mintKeyPair = anchor.web3.Keypair.generate();
    const mintPublicKey = mintKeyPair.publicKey;

    describe("after creating", () => {
      let mintAccount;
      before(async () => {
        // invoke instruction
        // getAccountInfo
        mintAccount = await program.account.manager.getAccountInfo(manager);
      });

      it.skip("should be owned by the token extensions program", async () => {
        expect(mintAccount);
      });
      it.skip("should have metadata pointer", async () => {});
    });

    describe("after updating", () => {
      it.skip("should have updated title", async () => {});
    });

    describe("after adding royalties", () => {
      it.skip("should contain seller fee basis points", async () => {});
      it.skip("should contain creators and their shares", async () => {});
      it.skip("should have wen_royalty_distribution extension registered", async () => {});
    });

    describe("after freezing", () => {
      before(async () => {
        // invoke freeze
      });

      it.skip("should be frozen", async () => {});

      describe("trying to transfer", () => {
        before(async () => {
          // invoke transfer should error
        });

        it.skip("should be blocked", async () => {});
      });
    });

    describe("after thawing", () => {
      it.skip("should be thawed", async () => {});
      describe("trying to transfer", () => {
        before(async () => {
          // invoke transfer should succeed
        });

        it.skip("should be allowed", async () => {});
      });
    });

    describe("after transferring", () => {
      it.skip("should be owned by the new owner", async () => {});
    });

    describe("after burning", () => {
      it.skip("should be burnt", async () => {});
      it.skip("should have no rent", async () => {});
      it.skip("should be owned by the system program", async () => {});
      it.skip("should have no data", async () => {});
    });
  });

  describe("group", () => {
    const groupAuthorityKeyPair = anchor.web3.Keypair.generate();
    const groupAuthorityPublicKey = groupAuthorityKeyPair.publicKey;

    const groupMintKeyPair = anchor.web3.Keypair.generate();
    const groupMintPublicKey = groupMintKeyPair.publicKey;

    const [group] = anchor.web3.PublicKey.findProgramAddressSync(
      [GROUP_ACCOUNT_SEED, groupMintPublicKey.toBuffer()],
      program.programId
    );

    let groupAccountInfo: anchor.web3.AccountInfo<Buffer>;
    let createGroupArgs;
    let groupAccount;

    before(async () => {
      createGroupArgs = {
        name: faker.lorem.text(),
        symbol: faker.lorem.word(),
        uri: faker.internet.url(),
        maxSize: faker.number.int({ min: 1, max: 1_000_000 }),
      };

      const mintTokenAccount = getAssociatedTokenAddressSync(
        groupMintKeyPair.publicKey,
        payer,
        true,
        TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .createGroupAccount(createGroupArgs)
        .accounts({
          mintTokenAccount,
          mint: groupMintKeyPair.publicKey,
          authority: groupAuthorityPublicKey,
          receiver: payer,
        })
        .signers([groupMintKeyPair, groupAuthorityKeyPair])
        .rpc();

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
      describe("the mint", () => {
        it.skip("should point back to the group", async () => {});
      });

      describe("the group", () => {
        it.skip("should a size of 1", async () => {});
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
