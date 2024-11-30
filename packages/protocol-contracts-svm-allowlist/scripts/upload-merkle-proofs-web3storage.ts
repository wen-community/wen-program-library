import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { uploadMerkleTree } from "../src/upload-merkle-proofs-web3storage";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const merkleTreePath = path.join(
  __dirname,
  "../../../crates/merkle-tree-cli/data/merkle_tree.json"
);

const main = async () => {
  try {
    console.log("Uploading merkle tree...");
    await uploadMerkleTree(merkleTreePath);
  } catch (error) {
    console.error("Error uploading merkle tree:", error);
  }
};

main();
