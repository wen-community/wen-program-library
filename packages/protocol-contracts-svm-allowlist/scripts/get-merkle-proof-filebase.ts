import { getProofForAddress } from "../src/get-merkle-proof";

const FILEBASE_S3_KEY = process.env.FILEBASE_S3_KEY;
const FILEBASE_S3_SECRET = process.env.FILEBASE_S3_SECRET;
const FILEBASE_BUCKET_NAME = process.env.FILEBASE_BUCKET_NAME;

const filebaseStructure = {
  folder: process.env.FILEBASE_FOLDER,
  collectionAddress: process.env.FILEBASE_COLLECTION_ADDRESS,
  phase: process.env.FILEBASE_PHASE_INDEX,
};

const main = async () => {
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
  try {
    const addressToQuery = "EA7uZqppoesNd3uvixCAgt426cbNKfanYemToJXNwQon"; // Replace with the address you want to query
    await getProofForAddress(
      addressToQuery,
      FILEBASE_S3_KEY,
      FILEBASE_S3_SECRET,
      FILEBASE_BUCKET_NAME,
      filebaseStructure.folder,
      filebaseStructure.collectionAddress,
      filebaseStructure.phase
    );
  } catch (error) {
    console.error("Error fetching proof:", error);
  }
};

main();
