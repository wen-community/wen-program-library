import { Connection, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import { initMarket } from "../instructions";
import { getWallet } from "@rarible_int/protocol-contracts-svm-core";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Initialize a Rarible Marketplace")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint URL")
  .requiredOption(
    "-m, --marketIdentifier <marketIdentifier>",
    "Market Identifier (string up to 32 characters)"
  )
  .requiredOption("--feeBps <feeBps>", "Fee in basis points (bps)")
  .requiredOption("--feeRecipient <feeRecipient>", "Fee recipient public key")
  .option("--ledger", "Use Ledger for signing transactions")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);
  const wallet = await getWallet(opts.ledger, opts.keypairPath);

  try {
    const { txid, tx, market } = await initMarket({
      wallet,
      params: {
        marketIdentifier: opts.marketIdentifier,
        feeBps: opts.feeBps,
        feeRecipient: opts.feeRecipient,
      },
      connection,
    });

    console.log(`Transaction ID: ${txid}`);
    console.log(`Market PDA: ${market.toBase58()}`);
  } catch (e) {
    console.error("An error occurred:", e);
  }
})();
