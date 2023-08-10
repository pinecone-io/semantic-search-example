import { config } from "dotenv";
import { getPineconeClient } from "./pinecone.js";
import { getEnv, validateEnvironmentVariables } from "./utils/util.js";

config();

export const deleteIndex = async () => {
  const indexName = getEnv("PINECONE_INDEX");
  validateEnvironmentVariables();
  // Initialize the Pinecone client
  const pineconeClient = await getPineconeClient();

  try {
    await pineconeClient.deleteIndex({
      indexName,
    });

    console.log(`Index is deleted: ${indexName}`);
  } catch (e) {
    console.error(e?.toString());
  }
};
