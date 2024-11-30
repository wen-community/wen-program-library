import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import { RawEntry, CsvEntry, RejectedEntry } from "./utils";
import { PublicKey } from "@solana/web3.js";

dotenv.config();

export async function verifyBurnTransaction(
  provider: ethers.JsonRpcProvider,
  txHash: string,
  expectedSigner: string,
  expectedContract: string,
  message: string,
  signature: string,
  address: string // minter address, recipient of minting rights
): Promise<boolean> {
  const prefix = process.env.CHAIN_NAME;
  const deprefixedSigner = expectedSigner.replace(new RegExp(`^${prefix}:`), "");

  // Verify the signature
  const messageHash = ethers.hashMessage(message);
  const recoveredAddress = ethers.recoverAddress(messageHash, signature);

  if (recoveredAddress.toLowerCase() !== deprefixedSigner.toLowerCase()) {
    throw new Error("!SignatureMatch");
  }

  // Fetch the transaction
  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    throw new Error(`Transaction not found for hash: ${txHash}`);
  }

  // Check if the transaction is to the expected contract
  if (tx.to && tx.to.toLowerCase() !== expectedContract.toLowerCase()) {
    throw new Error("!ContractAddressMatch");
  }

  // Lastly, verify that the address is valid.
  // Should be a valid Solana address
  try {
    const isValidSolanaAddress = PublicKey.isOnCurve(address);
    if (!isValidSolanaAddress) {
      throw new Error("!ValidMinterAddress");
    }
  } catch (error) {
    throw new Error("!ValidMinterAddress");
  }

  return true;
}

export async function verifyTransactionBatch(
  rawEntries: RawEntry[],
  CONTRACT_ADDRESS: string,
  batchSize: number = 10
): Promise<{ verifiedBurners: CsvEntry[]; rejectedBurners: RejectedEntry[] }> {
  batchSize = 100;
  const provider = new JsonRpcProvider("https://ethereum-rpc.publicnode.com");

  const verifiedBurners: CsvEntry[] = [];
  const rejectedBurners: RejectedEntry[] = [];

  // Process in batches
  for (let i = 0; i < rawEntries.length; i += batchSize) {
    const batch = rawEntries.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(rawEntries.length / batchSize)}`
    );

    // Map the batch entries to verification promises
    const verificationPromises = batch.map(async entry => {
      // Implement retry logic here
      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          attempt++;
          const isVerified = await verifyBurnTransaction(
            provider,
            entry.tx_hash,
            entry.signer,
            CONTRACT_ADDRESS,
            entry.message,
            entry.signature,
            entry.address
          );

          if (isVerified) {
            verifiedBurners.push({ address: entry.address, quantity: entry.quantity });
          }
          return; // Verification succeeded, exit the loop
        } catch (error) {
          console.error(`Error on attempt ${attempt} for tx_hash ${entry.tx_hash}: ${error.message}`);

          // If it's the last attempt, push to rejected burners
          if (attempt === maxRetries) {
            rejectedBurners.push({
              address: entry.address,
              quantity: entry.quantity,
              rejectionReason: error.message,
            });
          }
          // If not the last attempt, we wait and then retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    });

    await Promise.all(verificationPromises);
    console.log(`Completed batch ${Math.floor(i / batchSize) + 1}\n`);
  }

  return { verifiedBurners, rejectedBurners };
}
