// bidNft.ts

import { Connection, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import { bid } from "../instructions";
import { getWallet } from "@rarible_int/protocol-contracts-svm-core";
import { BN } from "@coral-xyz/anchor";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Place a bid on an NFT in the Rarible Marketplace")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint URL")
  .requiredOption("-m, --marketIdentifier <marketIdentifier>", "Market Identifier")
  .requiredOption("--nftMint <nftMint>", "NFT mint address")
  .requiredOption("--paymentMint <paymentMint>", "Payment mint address")
  .requiredOption("--price <price>", "Bid price in lamports")
  .requiredOption("--size <size>", "Size of the bid")
  .option("--ledger", "Use Ledger for signing transactions")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);
  const wallet = await getWallet(opts.ledger, opts.keypairPath);

  try {
    const { txid, order } = await bid({
      wallet,
      params: {
        marketIdentifier: opts.marketIdentifier,
        nftMint: opts.nftMint,
        paymentMint: opts.paymentMint,
        price: opts.price,
        size: opts.size,
        extraAccountParams: undefined, // Adjust if needed
      },
      connection,
    });

    console.log(`Transaction ID: ${txid}`);
    console.log(`Bid Order Account: ${order.toBase58()}`);
  } catch (e) {
    console.error("An error occurred:", e);
  }
})();
