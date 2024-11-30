import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { RawEntry } from "./utils";
import { parse } from "csv-parse/sync";

dotenv.config();

export async function fetchAllCsvRecords(): Promise<RawEntry[]> {
  if (!process.env.CSV_FILE_PATH) {
    throw new Error("CSV_FILE_PATH must be set");
  }

  const csvFilePath = path.resolve(__dirname, process.env.CSV_FILE_PATH);
  
  const fileContent = await fs.promises.readFile(csvFilePath, "utf8");
  const lines = fileContent.split("\n").map(line => line.trim()).filter(Boolean);

  // Parse the CSV content using 'csv-parse'
  const records = parse(fileContent, {
    columns: true,            // Use the first line as column names
    skip_empty_lines: true,   // Skip empty lines
    trim: true,               // Trim spaces around fields
  });

  if (records.length === 0) {
    throw new Error("CSV file is empty or missing data.");
  }

  // Validate that the CSV has the required columns
//   const requiredHeaders = ["tx_hash", "solana_address", "quantity", "message", "signer", "signature", "datetime"];
//   const missingHeaders = requiredHeaders.filter(header => !(header in records[0]));
//   if (missingHeaders.length > 0) {
//     throw new Error(`CSV file is missing required columns: ${missingHeaders.join(", ")}`);
//   }

  // Map the parsed records to the RawEntry format
  const allRecords: RawEntry[] = records.map((record: any) => ({
    tx_hash: record["﻿tx_hash"],
    address: record.solana_address,
    quantity: record.quantity,
    message: record.message,
    signer: record.signer,
    signature: record.signature,
    // Include datetime if RawEntry requires it:
    // datetime: record.datetime, 
  }));

  console.log(`Total records fetched: ${allRecords.length}`);
  return allRecords;
}
