import fs from "fs";
import path from "path";
import { Command } from "commander";
import { Connection } from "@solana/web3.js";
import {mintWithControls} from "../instructions"
import {getWallet} from "@rarible_int/protocol-contracts-svm-core"

const cli = new Command();

cli
  .version("1.0.0")
  .description("Mint from controls deployment")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-d, --deploymentId <deploymentId>", "Deployment id")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .requiredOption("-p, --phaseIndex <phaseIndex>", "Phase index")
  .requiredOption("-n, --numberOfMints <numberOfMints>", "Number of mints")
  .option("-m, --merkleProofPath <merkleProofPath>", "Path to JSON file containing merkle proof")
  .option("-a, --allowListPrice <allowListPrice>", "Allow list price")
  .option("-c, --allowListMaxClaims <allowListMaxClaims>", "Allow list max claims")
  .option("--recipient, --recipient <recipient>", "recipient of nft")
  .option("--ledger", "if you want to use ledger pass true")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);

  let merkleProof = null;
  if (opts.merkleProofPath) {
    const merkleData = JSON.parse(fs.readFileSync(opts.merkleProofPath, "utf8"));
    merkleProof = merkleData.proof;
  }

  const isAllowListMint = !!merkleProof;
  if (isAllowListMint) {
    if (!opts.allowListPrice || !opts.allowListMaxClaims) {
      throw Error("Allow list price and allow list max claims are required for allow list mint");
    }
  }

  const wallet = await getWallet(opts.ledger, opts.keypairPath);
  await mintWithControls({
      wallet: wallet,
      params: {
        editionsId: opts.deploymentId,
        phaseIndex: +opts.phaseIndex,
        numberOfMints: +opts.numberOfMints,
        merkleProof: merkleProof,
        allowListPrice: isAllowListMint ? opts.allowListPrice : null,
        allowListMaxClaims: isAllowListMint ? opts.allowListMaxClaims : null,
        isAllowListMint,
        recipient: opts.recipient,
      },
      connection,
    })
    .catch(error => {
      console.error("Error during minting: ", JSON.stringify(error, null, 2));
    })
    .finally(() => {
      console.log("Finished minting");
    });
})();
