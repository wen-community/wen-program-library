### Instructions for Generating and Managing Allowlists

#### Initial Setup

1. Clone the `protocol-contracts-svm` repository
2. Switch to the `feature/svm-merkle-trees` branch
3. Run `yarn install` to install dependencies

#### Allowlist Generation

4. Navigate to `packages/protocol-contracts-svm-allowlist` directory
5. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in required values (see Environment Variables section in README)
6. Generate the allowlist:
   - Run `npm run get-airtable-entries` to fetch burn entries
   - Run `npm run generate-burn-allowlist` to create the allowlist
7. Copy the generated `allow-list.csv` file to `crates/merkle-tree-cli/data` folder
8. Run `npm run generate-merkle-tree` to create the Merkle tree

#### Managing Proofs

9. Upload proofs to Web3.Storage:

   - Run `npm run upload-proofs-web3storage`
   - Save the returned CID for future reference

10. Retrieve proofs (when needed):
    - Run `npm run get-proof-web3storage` to fetch proof for specific address
