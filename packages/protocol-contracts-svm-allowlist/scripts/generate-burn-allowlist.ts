import { generateAllowlist } from "../src/generate-burn-allowlist";
import dotenv from "dotenv";
import { readRawFromCSV } from "../src/utils";

dotenv.config();

const main = async () => {
  const rawEntries = readRawFromCSV("raw-burners.csv");
  await generateAllowlist(rawEntries, 100);
};

main();
