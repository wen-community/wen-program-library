// fillOrder.ts

import { Connection, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import { cancelBid } from "../instructions";
import { getWallet } from "@rarible_int/protocol-contracts-svm-core";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Buy an NFT on the Rarible Marketplace")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint URL")
  .requiredOption("-o, --order <order>", "Order Identifier")
  .option("--ledger", "Use Ledger for signing transactions")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);
  const wallet = await getWallet(opts.ledger, opts.keypairPath);

  try {
    const { txid, order } = await cancelBid({
      wallet,
      params: {
          orderId: opts.order,
      },
      connection,
    });

    console.log(`Transaction ID: ${txid}`);
    console.log(`Order Account: ${order}`);
  } catch (e) {
    console.error("An error occurred:", e);
  }
})();
