import { ObjectManager } from "@filebase/sdk";
import { IncomingMessage } from "http";

export const getProofForAddress = async (
  address: string,
  FILEBASE_S3_KEY: string,
  FILEBASE_S3_SECRET: string,
  FILEBASE_BUCKET_NAME: string,
  FILEBASE_FOLDER: string,
  FILEBASE_COLLECTION_ADDRESS: string,
  FILEBASE_PHASE_INDEX: string
) => {
  if (!FILEBASE_S3_KEY || !FILEBASE_S3_SECRET || !FILEBASE_BUCKET_NAME) {
    throw new Error("Filebase credentials are not set");
  }
  const objectManager = new ObjectManager(FILEBASE_S3_KEY, FILEBASE_S3_SECRET, {
    bucket: FILEBASE_BUCKET_NAME,
  });

  try {
    const objectKey = `${FILEBASE_FOLDER}/${FILEBASE_COLLECTION_ADDRESS}/${FILEBASE_PHASE_INDEX}/${address}.json`;
    const downloadResult = await objectManager.download(objectKey, {});

    if (downloadResult instanceof IncomingMessage) {
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResult) {
        chunks.push(Buffer.from(chunk));
      }
      const data = Buffer.concat(chunks).toString("utf8");
      const proofData = JSON.parse(data);
      console.log(`Proof for address ${address}:`, proofData);
      return proofData;
    } else {
      throw new Error("Unexpected download result type");
    }
  } catch (error) {
    console.error(`Error fetching proof for address ${address}:`, error);
    return null;
  }
};
