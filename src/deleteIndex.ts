import { config } from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { getEnv, validateEnvironmentVariables } from "./utils/util.js";

config();
validateEnvironmentVariables();

export const deleteIndex = async () => {
  const indexName = getEnv("PINECONE_INDEX");

  const pinecone = new Pinecone();

  try {
    await pinecone.deleteIndex(indexName);
    console.log(`Index is deleted: ${indexName}`);
  } catch (e) {
    console.error(e?.toString());
  }
};
