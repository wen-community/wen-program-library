import * as fs from "fs";
import * as path from "path";
import { ethers, JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import { RawEntry, CsvEntry, RejectedEntry } from "./utils";
import { PublicKey } from "@solana/web3.js";
import { parse } from "csv-parse/sync";

dotenv.config();

export async function verifyAllowList(
    allowListPath: string
  ): Promise<boolean> {
  
    const fileContent = await fs.promises.readFile(allowListPath, "utf8");
  
    // Parse the CSV content using 'csv-parse'
    const records = parse(fileContent, {
      columns: true,            // Use the first line as column names
      skip_empty_lines: true,   // Skip empty lines
      trim: true,               // Trim spaces around fields
    });
  
    if (records.length === 0) {
      throw new Error("CSV file is empty or missing data.");
    }
  
    const addressesSet = new Set();
    const duplicateAddresses = new Set();
  
    // Iterate over each record to validate addresses and check for duplicates
    for (let record of records) {
      try {
        const isValidSolanaAddress = PublicKey.isOnCurve(record.address);
  
        if (!isValidSolanaAddress) {
          console.log("Invalid address:", record.address);
        } else {
          // Check for duplicates
          if (addressesSet.has(record.address)) {
            duplicateAddresses.add(record.address);
          } else {
            addressesSet.add(record.address);
          }
        }
      } catch (error) {
        console.log("Error with address:", record.address, error);
      }
    }
  
    // Report any duplicates found
    if (duplicateAddresses.size > 0) {
      console.log("Duplicate addresses found:");
      duplicateAddresses.forEach((address) => {
        console.log(address);
      });
    }
  
    return true;
  }
  