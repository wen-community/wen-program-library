import { create } from "@web3-storage/w3up-client";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { filesFromPaths } from "files-from-path";
import dotenv from "dotenv";

dotenv.config();

export async function uploadFolder() {
  // Check for required environment variables
  if (!process.env.WEB3_STORAGE_EMAIL) {
    throw new Error("WEB3_STORAGE_EMAIL must be set in your .env file.");
  }
  if (!process.env.WEB3_STORAGE_SPACE) {
    throw new Error("WEB3_STORAGE_SPACE must be set in your .env file.");
  }
  if (!process.env.FOLDER_PATH) {
    throw new Error("FOLDER_PATH must be set in your .env file.");
  }

  const folderPath = path.resolve(__dirname, process.env.FOLDER_PATH);

  // Initialize the Web3.Storage client
  console.log("Initializing W3Up client...");
  const client = await create();

  console.log(`Signing in with email: ${process.env.WEB3_STORAGE_EMAIL}`);
  await client.login(process.env.WEB3_STORAGE_EMAIL as `${string}@${string}`);
  console.log("Logged in successfully.");

  // Set the current space
  console.log(`Setting current space to: ${process.env.WEB3_STORAGE_SPACE}`);
  await client.setCurrentSpace(process.env.WEB3_STORAGE_SPACE as `did:${string}:${string}`);

  // Check if the folder exists
  try {
    await fsPromises.access(folderPath);
    console.log(`Folder found: ${folderPath}`);
  } catch (error) {
    throw new Error(`Folder not found: ${folderPath}`);
  }

  // Read files from the folder
  console.log(`Reading files from folder: ${folderPath}`);
  const files = await filesFromPaths([folderPath]);

  // Upload the folder content to Web3.Storage
  console.log("Uploading folder content to Web3.Storage...");
  const cid = await client.uploadDirectory(files);

  console.log(`✅ Successfully uploaded folder '${folderPath}' with CID: ${cid}`);
  console.log("Finished uploading folder content successfully.\n");
}

// Execute the uploadFolder function when this script is run
uploadFolder().catch(error => {
  console.error("Error uploading folder:", error);
});
