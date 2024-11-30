import Airtable from "airtable";
import { RawEntry } from "./utils";
import dotenv from "dotenv";

dotenv.config();

export async function fetchAllAirtableRecords(): Promise<RawEntry[]> {
  if (
    !process.env.AIRTABLE_API_KEY ||
    !process.env.AIRTABLE_BASE_ID ||
    !process.env.AIRTABLE_TABLE_NAME
  ) {
    throw new Error("AIRTABLE_API_KEY, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_NAME must be set");
  }

  Airtable.configure({
    apiKey: process.env.AIRTABLE_API_KEY as string,
  });
  const base = Airtable.base(process.env.AIRTABLE_BASE_ID as string);
  const table = base(process.env.AIRTABLE_TABLE_NAME as string);

  const allRecords: RawEntry[] = [];
  let pageCounter = 0;

  return new Promise((resolve, reject) => {
    table.select({}).eachPage(
      (records, fetchNextPage) => {
        pageCounter++;
        console.log(`Fetching Airtable page ${pageCounter}...`);
        console.log("Records in current page:", records.length);

        const pageRecords: RawEntry[] = records.map(record => ({
          tx_hash: record.get("tx_hash") as string,
          address: record.get("solana_address") as string,
          quantity: record.get("quantity") as string,
          message: record.get("message") as string,
          signer: record.get("signer") as string,
          signature: record.get("signature") as string,
        }));

        allRecords.push(...pageRecords);
        console.log(`Total records fetched so far: ${allRecords.length}\n`);

        fetchNextPage();
      },
      error => {
        if (error) {
          reject(error);
        } else {
          resolve(allRecords);
        }
      }
    );
  });
}
