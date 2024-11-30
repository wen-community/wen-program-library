import * as fs from "fs";
import * as path from "path";
import { createObjectCsvWriter } from "csv-writer";
import { parse } from "csv-parse/sync";

// You can use __dirname directly in CommonJS modules

export interface RawEntry {
  tx_hash: string;
  address: string;
  quantity: string;
  message: string;
  signer: string;
  signature: string;
}

export interface CsvEntry {
  address: string;
  quantity: string;
}

export interface RejectedEntry extends CsvEntry {
  rejectionReason: string;
}

export async function writeRawToCSV(filePath: string, entries: RawEntry[]) {
  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const writer = createObjectCsvWriter({
    path: path.join(dataDir, filePath),
    header: [
      { id: "tx_hash", title: "tx_hash" },
      { id: "address", title: "address" },
      { id: "quantity", title: "quantity" },
      { id: "message", title: "message" },
      { id: "signer", title: "signer" },
      { id: "signature", title: "signature" },
    ],
  });

  await writer.writeRecords(entries);
  console.log(`Raw CSV file written successfully: ${path.join(dataDir, filePath)}`);
}

export async function writeToCSVWithErrorCode(filePath: string, entries: RejectedEntry[]) {
  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const writer = createObjectCsvWriter({
    path: path.join(dataDir, filePath),
    header: [
      { id: "address", title: "address" },
      { id: "price", title: "price" },
      { id: "max_claims", title: "max_claims" },
      { id: "error_code", title: "error_code" },
    ],
  });

  const records = entries.map((entry) => ({
    address: entry.address,
    price: 0,
    max_claims: entry.quantity,
    error_code: entry.rejectionReason,
  }));

  await writer.writeRecords(records);
}

export async function writeToCSV(filePath: string, entries: CsvEntry[]) {
  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const writer = createObjectCsvWriter({
    path: path.join(dataDir, filePath),
    header: [
      { id: "address", title: "address" },
      { id: "price", title: "price" },
      { id: "max_claims", title: "max_claims" },
    ],
  });

  const records = entries.map((entry) => ({
    address: entry.address,
    price: 300000,
    max_claims: entry.quantity,
  }));

  await writer.writeRecords(records);
  console.log(`CSV file written successfully: ${path.join(dataDir, filePath)}`);
}

export function deduplicateEntries(entries: CsvEntry[]): CsvEntry[] {
  const merged = new Map<string, number>();

  entries.forEach((entry) => {
    const currentQuantity = merged.get(entry.address) || 0;
    merged.set(entry.address, currentQuantity + parseInt(entry.quantity));
  });

  return Array.from(merged.entries()).map(([address, quantity]) => ({
    address,
    quantity: quantity.toString(),
  }));
}

export function readRawFromCSV(filePath: string): RawEntry[] {
  const dataDir = path.join(__dirname, "../data");
  const csvContent = fs.readFileSync(path.join(dataDir, filePath), "utf8");
  const entries = parse(csvContent, { columns: true });
  return entries as RawEntry[];
}
