import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { config } from "dotenv";

import { WenNewStandard } from "../../target/types/wen_new_standard";
import WNSIdl from "../../target/idl/wen_new_standard.json";
import { WenRoyaltyDistribution } from "../../target/types/wen_royalty_distribution";
import WenRoyaltyIdl from "../../target/idl/wen_royalty_distribution.json";

import accountsDevnet from "../devnet.json";
import accountsMainnet from "../mainnet.json";
import { filterAvailableAccounts } from "./utils";

(async function (isDevnet: boolean) {
  config({ path: "../.env" });
  try {
    const DEVNET_URL = process.env.DEVNET_URL;
    const MAINNET_URL = process.env.MAINNET_URL;
    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.KEYPAIR)),
    );
    console.log(`Signing Address: ${keypair.publicKey.toString()}`);
    const connection = new Connection(isDevnet ? DEVNET_URL : MAINNET_URL, {
      commitment: "confirmed",
    });

    // To test locally.
    // const connection = new Connection("http://localhost:8899");

    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {
      skipPreflight: true,
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    const wnsProgram = new Program(WNSIdl as WenNewStandard, provider);
    const distributionProgram = new Program(
      WenRoyaltyIdl as WenRoyaltyDistribution,
      provider,
    );

    const wnsAccounts: Record<
      string,
      { pubkey: string; type: string; account: { data: string[] } }
    > = isDevnet ? accountsDevnet["wns"] : accountsMainnet["wns"];

    const finalAccounts = await filterAvailableAccounts(
      connection,
      wnsAccounts,
    );
    const filteredWnsAccounts = Object.values(finalAccounts).filter(
      (wnsAccount) => wnsAccount.type !== "unknown",
    );

    for (const {
      pubkey,
      type,
      account: { data },
    } of Object.values(filteredWnsAccounts)) {
      const accountBuffer = Buffer.from(data[0], "base64");

      try {
        switch (type) {
          case "tokenGroup": {
            const tokenGroup = wnsProgram.coder.accounts.decode(
              "tokenGroup",
              accountBuffer,
            );
            const [_, bump] = PublicKey.findProgramAddressSync(
              [Buffer.from("group"), tokenGroup.mint.toBuffer()],
              wnsProgram.programId,
            );

            console.log(
              `Expected Bump: ${bump}, Received Bump: ${
                tokenGroup.bump
              }. Is Equal: ${bump === tokenGroup.bump}\n`,
            );
            continue;
          }
          case "manager": {
            const manager = wnsProgram.coder.accounts.decode(
              "manager",
              accountBuffer,
            );
            const [_, bump] = PublicKey.findProgramAddressSync(
              [Buffer.from("manager")],
              wnsProgram.programId,
            );

            console.log(
              `Expected Bump: ${bump}, Received Bump: ${
                manager.bump
              }. Is Equal: ${bump === manager.bump}\n`,
            );
            continue;
          }
          case "tokenGroupMember": {
            const tokenGroupMember = wnsProgram.coder.accounts.decode(
              "tokenGroupMember",
              accountBuffer,
            );
            const [_, bump] = PublicKey.findProgramAddressSync(
              [Buffer.from("member"), tokenGroupMember.mint.toBuffer()],
              wnsProgram.programId,
            );

            console.log(
              `Expected Bump: ${bump}, Received Bump: ${
                tokenGroupMember.bump
              }. Is Equal: ${bump === tokenGroupMember.bump}\n`,
            );
            continue;
          }
        }
      } catch (err) {
        console.log(err);
        continue;
      }
    }

    const distributionAccounts: Record<
      string,
      { pubkey: string; type: string; account: { data: string[] } }
    > = isDevnet
      ? accountsDevnet["distribution"]
      : accountsMainnet["distribution"];

    const finalDistAccounts = await filterAvailableAccounts(
      connection,
      distributionAccounts,
    );

    for (const { pubkey, type } of Object.values(finalDistAccounts)) {
      const accountPubkey = new PublicKey(pubkey);
      const { data: accountBuffer } = await connection.getAccountInfo(
        accountPubkey,
        "confirmed",
      );

      console.log(type);

      const distributionAccount = distributionProgram.coder.accounts.decode(
        "distributionAccount",
        accountBuffer,
      );

      const [_, bump] = PublicKey.findProgramAddressSync(
        [
          distributionAccount.groupMint.toBuffer(),
          distributionAccount.paymentMint.toBuffer(),
        ],
        distributionProgram.programId,
      );

      console.log(
        `Expected Bump: ${bump}, Received Bump: ${
          distributionAccount.bump
        }. Is Equal: ${bump === distributionAccount.bump}\n`,
      );
    }
  } catch (err) {
    console.error(err);
  }
})(false);
