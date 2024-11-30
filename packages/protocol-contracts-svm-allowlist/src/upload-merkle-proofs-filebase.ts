import { ObjectManager } from "@filebase/sdk";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { PublicKey } from "@solana/web3.js";

export const uploadMerkleTree = async (
  FILEBASE_S3_KEY: string,
  FILEBASE_S3_SECRET: string,
  FILEBASE_BUCKET_NAME: string,
  FILEBASE_FOLDER: string,
  FILEBASE_COLLECTION_ADDRESS: string,
  FILEBASE_PHASE_INDEX: string,
  MERKLE_TREE_PATH: string,
  PROOFS_DIR: string
) => {
  if (
    !FILEBASE_S3_KEY ||
    !FILEBASE_S3_SECRET ||
    !FILEBASE_BUCKET_NAME ||
    !FILEBASE_FOLDER ||
    !FILEBASE_COLLECTION_ADDRESS ||
    !FILEBASE_PHASE_INDEX ||
    !MERKLE_TREE_PATH ||
    !PROOFS_DIR
  ) {
    throw new Error("Missing required parameters");
  }
  const objectManager = new ObjectManager(FILEBASE_S3_KEY, FILEBASE_S3_SECRET, {
    bucket: FILEBASE_BUCKET_NAME,
  });

  const merkleTreeData = JSON.parse(await fsPromises.readFile(MERKLE_TREE_PATH, "utf-8"));
  await fsPromises.mkdir(PROOFS_DIR, { recursive: true });

  console.log("Processing merkle tree data...");
  const totalNodes = merkleTreeData.tree_nodes.length;
  let counter = 0;

  for (const node of merkleTreeData.tree_nodes) {
    counter++;
    const claimant = new PublicKey(Buffer.from(node.claimant)).toBase58();
    const nodeData = {
      claimant,
      claim_price: node.claim_price,
      max_claims: node.max_claims,
      proof: node.proof,
    };
    const fileName = `${claimant}.json`;
    const filePath = path.join(PROOFS_DIR, fileName);

    // write proof to the proofs folder
    const stringifiedProof = JSON.stringify(nodeData, null, 2);
    await fsPromises.writeFile(filePath, stringifiedProof);

    // upload proof to the object manager (filebase)
    console.log(`Uploading proof for ${claimant} (${counter}/${totalNodes})...`);
    const filebasePath = `${FILEBASE_FOLDER}/${FILEBASE_COLLECTION_ADDRESS}/${FILEBASE_PHASE_INDEX}/${fileName}`;
    const uploadedObject = await objectManager.upload(filebasePath, stringifiedProof, {}, {});
    console.log(`Uploaded: ${filebasePath}`);
  }
  console.log("Finished uploading merkle tree proofs successfully.");
};
