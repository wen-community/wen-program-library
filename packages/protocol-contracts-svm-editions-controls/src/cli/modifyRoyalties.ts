export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Command } from "commander";
import {modifyRoyalties} from "../instructions"
import {getWallet} from "@rarible_int/protocol-contracts-svm-core"

const cli = new Command();

cli
  .version("1.0.0")
  .description("Modify royalties for a specific NFT edition deployment")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint")
  .requiredOption("-d, --deploymentId <deploymentId>", "ID of the deployment to update royalties")
  .requiredOption("--royaltyBasisPoints <royaltyBasisPoints>", "New royalty basis points (e.g., 500 for 5%)")
  .requiredOption(
    "--creators <creators>",
    "List of creators and their shares in the format 'address:share,address:share' (e.g., '8YkPQFLXq23z7Xz1W4oS:50,FzPQA3drtY9xZGR:50')"
  )
  .option("--ledger", "if you want to use ledger pass true")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);

  // Read the keypair file to create a wallet
  const wallet = await getWallet(opts.ledger, opts.keypairPath);

  // Parse the creators input (address:share pairs)
  const creators = opts.creators.split(",").map((creator: string) => {
    const [address, share] = creator.split(":");
    return { address: new PublicKey(address), share: Number(share) };
  });

  try {
    // Call modifyRoyalties function to update royalties on-chain
    const { editions } = await modifyRoyalties({
      wallet: wallet,
      params: {
        editionsId: opts.deploymentId,
        royaltyBasisPoints: Number(opts.royaltyBasisPoints),
        creators,
      },
      connection,
    });

    console.log(`Royalties updated successfully for editions: ${editions}`);
  } catch (e) {
    console.error("Error updating royalties:", e);
  }
})();
