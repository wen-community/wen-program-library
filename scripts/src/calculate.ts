import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Keypair, Connection, AccountInfo, PublicKey } from "@solana/web3.js";

import { WenNewStandard } from "../../target/types/wen_new_standard";
import WNSIdl from "../../target/idl/wen_new_standard.json";
import { WenRoyaltyDistribution } from "../../target/types/wen_royalty_distribution";
import WenRoyaltyIdl from "../../target/idl/wen_royalty_distribution.json";

import { writeFile } from "fs-extra";

import { config } from "dotenv";
import { getType } from "./utils";

(async function (isDevnet: boolean) {
  config({ path: "../.env" });
  try {
    const DEVNET_URL = process.env.DEVNET_URL;
    const MAINNET_URL = process.env.MAINNET_URL;

    const keypair = Keypair.generate();
    const connection = new Connection(isDevnet ? DEVNET_URL : MAINNET_URL, {
      commitment: "confirmed",
    });
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

    const data: Record<
      string,
      {
        account: AccountInfo<Buffer>;
        pubkey: PublicKey;
      }
    > = {};

    console.log(`\n-----------------------------------------------------`);
    console.log(`WNS:`);
    console.log(`-----------------------------------------------------`);

    const wnsAccounts = (
      await connection.getProgramAccounts(wnsProgram.programId, "confirmed")
    ).reduce(
      (acc, account) => {
        acc[account.pubkey.toString()] = {
          ...account,
          account: {
            ...account.account,
            data: [account.account.data.toString("base64"), "base64"],
          },
          type: getType(account.account.data),
        };

        return acc;
      },
      {} as Readonly<{
        account: AccountInfo<Buffer>;
        pubkey: PublicKey;
      }>,
    );

    const pubkeys = Object.keys(wnsAccounts)
      .map((a) => `--clone ${a}`)
      .slice(0, 50);

    console.log("WNS GPA Count:", Object.keys(wnsAccounts).length);
    console.log(`-----------------------------------------------------`);

    data.wns = wnsAccounts;
    console.log(`\n-----------------------------------------------------`);
    console.log(`Distribution Program:`);
    console.log(`-----------------------------------------------------`);

    const distributionAccounts = (
      await connection.getProgramAccounts(distributionProgram.programId)
    ).reduce(
      (acc, account) => {
        acc[account.pubkey.toString()] = {
          ...account,
          account: {
            ...account.account,
            data: [account.account.data.toString("base64"), "base64"],
          },
          type: getType(account.account.data),
        };

        return acc;
      },
      {} as Readonly<{
        account: AccountInfo<Buffer>;
        pubkey: PublicKey;
      }>,
    );

    console.log(
      "Distribution Program GPA:",
      Object.keys(distributionAccounts).length,
    );
    console.log(`-----------------------------------------------------`);

    data.distribution = distributionAccounts;

    pubkeys.push(
      ...Object.keys(distributionAccounts)
        .slice(0, 50)
        .map((a) => `--clone ${a}`),
    );

    await writeFile(
      `${__dirname}/../${isDevnet ? "devnet" : "mainnet"}.json`,
      JSON.stringify(data, null, 2),
      { encoding: "utf8" },
    );

    // console.log(
    //   `solana-test-validator -r --bpf-program wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM ~/Desktop/blockchain-projects/abk-wpl/target/deploy/wen_new_standard.so --bpf-program diste3nXmK7ddDTs1zb6uday6j4etCa9RChD8fJ1xay ~/Desktop/blockchain-projects/abk-wpl/target/deploy/wen_royalty_distribution.so ${pubkeys.join(
    //     " "
    //   )} -u${isDevnet ? "d" : "m"}`
    // );
  } catch (err) {
    console.error(err);
  }
})(false);
