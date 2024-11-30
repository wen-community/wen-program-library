import { Connection, PublicKey } from "@solana/web3.js";

import { Command } from "commander";
import BN from "bn.js";
import {createDeployment} from "../instructions/createControlDeployment"
import {getWallet} from "@rarible_int/protocol-contracts-svm-core"

// Define CLI options
const cli = new Command();

cli
  .version("1.0.0")
  .description("Create an editions account==== with controls")
  .requiredOption("-k, --keypairPath <keypairPath>", "Path to the keypair file")
  .requiredOption("-s, --symbol <symbol>", "Symbol of the edition")
  .requiredOption("-n, --collectionName <collectionName>", "Name of the edition")
  .requiredOption("-u, --collectionUri <collectionUri>", "JSON URL for metadata")
  .requiredOption("-t, --treasuryWallet <treasuryWallet>", "Public key of the treasury wallet")
  .requiredOption("--maxMintsPerWallet <maxMintsPerWallet>", "Max mints per wallet, 0 for unlimited")
  .requiredOption("--maxNumberOfTokens <maxNumberOfTokens>", "Max number of tokens, 0 for unlimited")
  .requiredOption("--creators <creators...>", "List of creators in the format '<address>:<share>'")
  .requiredOption("--royaltyBasisPoints <royaltyBasisPoints>", "Royalty basis points (1000 = 10%)")
  .option("--extraMeta <extraMeta...>", "Extra metadata in the format '<field>:<value>'")
  .requiredOption("--itemBaseUri <itemBaseUri>", "Base URI for the item metadata")
  .requiredOption("--itemBaseName <itemBaseName>", "Name for each item in the edition")
  .option("--cosignerProgramId <cosignerProgramId>", "Optional cosigner program ID (PublicKey)")
  .requiredOption("--platformFeeValue <platformFeeValue>", "Platform fee value (e.g., amount in lamports or basis points)")
  .option("--isFeeFlat", "Indicate if the platform fee is a flat amount")
  .requiredOption("--platformFeeRecipients <platformFeeRecipients...>", "List of platform fee recipients in the format '<address>:<share>'")
  .requiredOption("-r, --rpc <rpc>", "RPC endpoint")
  .option("--ledger <boolean>", "if you want to use ledger pass true")
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  try {
    const connection = new Connection(opts.rpc);
    const wallet = await getWallet(opts.ledger, opts.keypairPath);

    // Parse creators input
    const creators = opts.creators.map((creator: string) => {
      const [address, share] = creator.split(":");
      if (!address || isNaN(parseInt(share))) {
        throw new Error(`Invalid creator input: ${creator}. Expected format: '<address>:<share>'`);
      }
      return { address: new PublicKey(address), share: parseInt(share) };
    });

    // Parse platform fee recipients input
    const platformFeeRecipients = opts.platformFeeRecipients.map((recipient: string) => {
      const [address, share] = recipient.split(":");
      if (!address || isNaN(parseInt(share))) {
        throw new Error(`Invalid platform fee recipient input: ${recipient}. Expected format: '<address>:<share>'`);
      }
      return { address: new PublicKey(address), share: parseInt(share) };
    });

    // Parse extra metadata input
    const extraMeta = opts.extraMeta
      ? opts.extraMeta.map((meta: string) => {
          const [field, value] = meta.split(":");
          if (!field || !value) {
            throw new Error(`Invalid extraMeta input: ${meta}. Expected format: '<field>:<value>'`);
          }
          return { field, value };
        })
      : [];

    // Parse cosigner program ID (if provided)
    const cosignerProgramId = opts.cosignerProgramId ? new PublicKey(opts.cosignerProgramId) : null;

    // Prepare the royalties object
    const royalties = {
      royaltyBasisPoints: +opts.royaltyBasisPoints, // Note the camelCase field name
      creators,
    };

    // Prepare the platform fee object
    const platformFeeValue = new BN(opts.platformFeeValue);
    const isFeeFlat = !!opts.isFeeFlat; // true if flag is provided, false otherwise

    const platformFee = {
      platformFeeValue,
      isFeeFlat,
      recipients: platformFeeRecipients,
    };

    // Create the deployment
    const { editions, editionsControls } = await createDeployment({
      wallet,
      params: {
        symbol: opts.symbol,
        collectionName: opts.collectionName,
        collectionUri: opts.collectionUri,
        treasury: opts.treasuryWallet,
        maxMintsPerWallet: +opts.maxMintsPerWallet,
        maxNumberOfTokens: +opts.maxNumberOfTokens,
        royalties,
        platformFee,
        extraMeta,
        itemBaseUri: opts.itemBaseUri,
        itemBaseName: opts.itemBaseName,
        cosignerProgramId,
      },
      connection,
    });

    console.log(`New edition id: ${editions.toBase58()}, controls: ${editionsControls.toBase58()}`);
  } catch (e) {
    console.error("Error creating deployment:", e);
  }
})();
