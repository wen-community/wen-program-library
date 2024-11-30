import { writeToCSV, writeToCSVWithErrorCode, deduplicateEntries, RawEntry } from "./utils";
import { verifyTransactionBatch } from "./verify-burn-tx";

export const generateAllowlist = async (rawEntries: RawEntry[], BATCH_SIZE: number = 10) => {
  if (!process.env.BURN_CONTRACT_ADDRESS) {
    throw new Error("BURN_CONTRACT_ADDRESS must be set");
  }

  try {
    console.log(`\nVerifying transactions in batches of size ${BATCH_SIZE}...`);
    const { verifiedBurners, rejectedBurners } = await verifyTransactionBatch(
      rawEntries,
      process.env.BURN_CONTRACT_ADDRESS as string,
      BATCH_SIZE
    );

    await writeToCSV("verified-burners.csv", verifiedBurners);
    await writeToCSVWithErrorCode("rejected-burners.csv", rejectedBurners);

    const mergedEntries = deduplicateEntries(verifiedBurners);
    await writeToCSV("allow_list.csv", mergedEntries);

    console.log("Allowlist generation completed successfully.");
  } catch (error) {
    console.error("Error generating allowlist:", error);
  }
};
