import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { Command } from "commander";
import { modifyPhase } from "../instructions";
import { getWallet } from "@rarible_int/protocol-contracts-svm-core";

const cli = new Command();


cli
  .version("1.0.0")
  .description("Add phase to a control deployment")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .requiredOption("-d, --deploymentId <deploymentId>", "controls ID")
  .option("-s, --startTime <startTime>", "start time")
  .option("-e, --endTime <endTime>", "end time")
  .requiredOption("--maxMintsPerWallet <maxMintsPerWallet>", "Max mints per wallet (total), 0 for unlimited")
  .requiredOption("--maxMintsTotal <maxMintsTotal>", "Max mints per phase (total across all wallets), 0 for unlimited")
  .requiredOption("--priceAmount <priceAmount>", "Price per mint in lamports, can be 0")
  .requiredOption("--phaseIndex <phaseIndex>", "Phase index, can be 0")
  .option("-m, --merkleRootPath <merkleRootPath>", "Path to JSON file containing merkle root")
  .option("-p, --isPrivate <isPrivate>", "If true, the phase will be allow-list only")
  .option("--ledger", "if you want to use ledger pass true")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);

  // Get merkle root from the provided path
  let merkleRoot = null;
  if (opts.merkleRootPath) {
    const merkleData = JSON.parse(
      fs.readFileSync(path.resolve(opts.merkleRootPath), "utf8")
    );
    merkleRoot = merkleData.merkle_root;
  }

  // If the phase is private, merkle root is required
  if (opts.isPrivate && !merkleRoot) {
    throw new Error("Merkle root is required for a private phase");
  }

  const wallet = await getWallet(opts.ledger, opts.keypairPath);

  try {
    const { txid } = await modifyPhase({
      wallet,
      params: {
          deploymentId: opts.deploymentId,
          phaseIndex: opts.phaseIndex,
          priceAmount: opts.priceAmount,
          maxMintsPerWallet: opts.maxMintsPerWallet,
          maxMintsTotal: opts.maxMintsTotal,
          startTime: opts.startTime ? +opts.startTime : null,
          endTime: opts.endTime ? +opts.endTime : null,
          merkleRoot: merkleRoot,
          isPrivate: opts.isPrivate ? opts.isPrivate : false,
          active: opts.active ? opts.active : true,
          priceToken: opts.priceToken ? opts.priceToken : "So11111111111111111111111111111111111111112"
      },
      connection,
    });

    console.log(`Transaction successful. txid: ${txid}`);
  } catch (e) {
    console.error("An error occurred while modifying the phase:", e);
  }
})();
