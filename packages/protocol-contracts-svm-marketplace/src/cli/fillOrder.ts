// fillOrder.ts

import { Connection, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import { fillOrder } from "../instructions";
import { getWallet } from "@rarible_int/protocol-contracts-svm-core";
import { BN } from "@coral-xyz/anchor";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Buy an NFT on the Rarible Marketplace")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint URL")
  .requiredOption("-o, --order <order>", "Order Identifier")
  .requiredOption("--amountToFill <amountToFill>", "amountToFill of the listing")
  .option("--ledger", "Use Ledger for signing transactions")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);
  const wallet = await getWallet(opts.ledger, opts.keypairPath);

  try {
    const { txid, order } = await fillOrder({
      wallet,
      params: {
          orderAddress: opts.order,
          extraAccountParams: undefined,
          amountToFill: 1
      },
      connection,
    });

    console.log(`Transaction ID: ${txid}`);
    console.log(`Order Account: ${order.market}`);
  } catch (e) {
    console.error("An error occurred:", e);
  }
})();
