#!/usr/bin/env ts-node

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import BN from "bn.js";
import {modifyPlatformFee} from "../instructions"
import {getWallet} from "@rarible_int/protocol-contracts-svm-core"

const cli = new Command();

cli
  .version("1.0.0")
  .description("Modify platform fee for a specific NFT edition deployment")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint")
  .requiredOption(
    "-d, --deploymentId <deploymentId>",
    "ID of the deployment to update platform fee"
  )
  .requiredOption(
    "--platformFeeValue <platformFeeValue>",
    "New platform fee value (e.g., amount in lamports or basis points)"
  )
  .option(
    "--isFeeFlat",
    "Indicate if the platform fee is a flat amount. If not provided, it is considered percentage-based."
  )
  .requiredOption(
    "--recipients <recipients>",
    "List of recipients and their shares in the format 'address:share,address:share' (e.g., '8YkPQFLXq23z7Xz1W4oS:50,FzPQA3drtY9xZGR:50')"
  )
  .option("--ledger", "if you want to use ledger pass true")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);

  // Read the keypair file to create a wallet
  console.log("wallet 0")
  const wallet = await getWallet(opts.ledger, opts.keypairPath);
  console.log("wallet 1")
  // Parse the recipients input (address:share pairs)
  const recipients = opts.recipients.split(",").map((recipient: string) => {
    const [address, share] = recipient.split(":");
    if (!address || isNaN(parseInt(share))) {
      throw new Error(
        `Invalid recipient input: ${recipient}. Expected format: 'address:share'`
      );
    }
    return { address: new PublicKey(address), share: parseInt(share) };
  });
  console.log("wallet 2")
  // Parse platform fee value and isFeeFlat flag
  const platformFeeValue = new BN(opts.platformFeeValue);
  const isFeeFlat = !!opts.isFeeFlat;
  console.log("wallet 3", opts.deploymentId, platformFeeValue, isFeeFlat, recipients)
  try {
    // Call modifyPlatformFee function to update platform fee on-chain
    const { editions, txid } = await modifyPlatformFee({
      wallet: wallet,
      params: {
        editionsId: opts.deploymentId,
        platformFeeValue,
        isFeeFlat,
        recipients,
      },
      connection,
    });

    console.log(
      `Platform fee updated successfully for editions: ${editions.toBase58()}`
    );
    console.log(`Transaction ID: ${txid}`);
  } catch (e) {
    console.error("Error updating platform fee:", e);
  }
})();
