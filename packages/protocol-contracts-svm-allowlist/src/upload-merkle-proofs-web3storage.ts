import { create } from "@web3-storage/w3up-client";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { PublicKey } from "@solana/web3.js";
import { filesFromPaths } from "files-from-path";
import dotenv from "dotenv";

dotenv.config();

export const uploadMerkleTree = async (MERKLE_TREE_PATH: string) => {
  // if (!process.env.WEB3_STORAGE_EMAIL) {
  //   throw new Error("WEB3_STORAGE_EMAIL must be set");
  // }
  // if (!process.env.WEB3_STORAGE_SPACE) {
  //   throw new Error("WEB3_STORAGE_SPACE must be set");
  // }

  const PROOFS_DIR = "./data/proofs";

  // Initialize client
  console.log("Initializing client...");
  //const client = await create();

  console.log(
    `Signing in with email: ${process.env.WEB3_STORAGE_EMAIL}, confirm authentication mail to continue, this has to be done once in your client...`
  );
  //await client.login(process.env.WEB3_STORAGE_EMAIL as `${string}@${string}`);
  console.log("Logged in successfully.");

  // Create proofs directory
  console.log("Creating proofs directory...");
  const merkleTreeData = JSON.parse(await fsPromises.readFile(MERKLE_TREE_PATH, "utf-8"));
  await fsPromises.mkdir(PROOFS_DIR, { recursive: true });

  // Process nodes and write proofs
  console.log("Processing merkle tree data...");
  const { tree_nodes } = merkleTreeData;

  await Promise.all(
    tree_nodes.map(async (node, i) => {
      const claimant = new PublicKey(Buffer.from(node.claimant)).toBase58();
      const nodeData = {
        claimant,
        claim_price: node.claim_price,
        max_claims: node.max_claims,
        proof: node.proof,
      };

      const fileName = `${claimant}.json`;
      const filePath = path.join(PROOFS_DIR, fileName);

      await fsPromises.writeFile(filePath, JSON.stringify(nodeData, null, 2));
    })
  );
  console.log(`Wrote all proofs to ${PROOFS_DIR} \n`);

  // Upload proofs
  // console.log("Uploading all proofs to Web3.Storage...");
  // await client.setCurrentSpace(process.env.WEB3_STORAGE_SPACE as `did:${string}:${string}`);

  // const files = await filesFromPaths([PROOFS_DIR]);
  // const cid = await client.uploadDirectory(files);

  // console.log(`Uploaded all proofs with CID: ${cid}`);
  // console.log("Finished uploading merkle tree proofs successfully.");
};
