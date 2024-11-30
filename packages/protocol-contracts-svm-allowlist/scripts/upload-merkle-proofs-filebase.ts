import path from "path";
import { uploadMerkleTree } from "../src/upload-merkle-proofs-filebase";
import dotenv from "dotenv";

dotenv.config();

const FILEBASE_S3_KEY = process.env.FILEBASE_S3_KEY;
const FILEBASE_S3_SECRET = process.env.FILEBASE_S3_SECRET;
const FILEBASE_BUCKET_NAME = process.env.FILEBASE_BUCKET_NAME;

const filebaseStructure = {
  folder: process.env.FILEBASE_FOLDER,
  collectionAddress: process.env.FILEBASE_COLLECTION_ADDRESS,
  phase: process.env.FILEBASE_PHASE_INDEX,
};

const paths = {
  merkleTreePath: path.join(__dirname, "../../crates/merkle-tree-cli/data/merkle-tree.json"),
  proofsDir: path.join(__dirname, "../../crates/merkle-tree-cli/data/proofs"),
};

const main = async () => {
  try {
    if (!FILEBASE_S3_KEY || !FILEBASE_S3_SECRET || !FILEBASE_BUCKET_NAME) {
      throw new Error("Filebase credentials are not set");
    }
    if (
      !filebaseStructure.folder ||
      !filebaseStructure.collectionAddress ||
      !filebaseStructure.phase
    ) {
      throw new Error("Filebase structure is not set");
    }
    await uploadMerkleTree(
      FILEBASE_S3_KEY,
      FILEBASE_S3_SECRET,
      FILEBASE_BUCKET_NAME,
      filebaseStructure.folder,
      filebaseStructure.collectionAddress,
      filebaseStructure.phase,
      paths.merkleTreePath,
      paths.proofsDir
    );
  } catch (error) {
    console.error("Error uploading merkle tree:", error);
  }
};

main();
