# Protocol Contracts SVM Allowlist

This package provides tools for generating, managing, and interacting with Allow lists on Solana Virtual Machine. 

## Scripts

### 1. `generate-allowlist.ts`

This script generates an allowlist by verifying burn transactions from Airtable records. It writes the verified and rejected entries to CSV files and merges the verified entries into a final allowlist.

**Key Functionality:**
- Fetches and verifies records from Airtable.
- Writes verified and rejected entries to CSV files.
- Merges verified entries into a final deduplicated allowlist

### 2. `upload-merkle-proofs.ts`

This script uploads Merkle tree proofs to a Filebase S3 bucket. It reads the Merkle tree data from a specified file, processes each node, and uploads the proof data to the bucket.

**Key Functionality:**
- Reads and processes Merkle tree data.
- Uploads proof data to Filebase.
- Logs the progress of the upload process.

### 3. `get-merkle-proof.ts`

This script is responsible for fetching the Merkle proof for a given address from a Filebase S3 bucket. It uses the `ObjectManager` from the `@filebase/sdk` to download the proof data.

**Key Functionality:**
- Fetches proof data for a specified address.

## Setup

1. **Environment Variables:**
   - Ensure that all necessary environment variables are set in a `.env` file or your environment. This includes credentials for Filebase and Airtable, as well as any other required configuration.

2. **Dependencies:**
   - Install the required dependencies using `npm install` or `yarn install`.

3. **Running Scripts:**
   - Use `ts-node` or compile the TypeScript files to JavaScript to run the scripts. Ensure that the environment is correctly configured before execution.

## License

This project is licensed under the MIT License.