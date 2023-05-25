import { config } from "dotenv";
import { getPineconeClient } from "./pinecone.js";
import { getEnv, validateEnvironmentVariables } from "./utils/util.js";

config();
const indexName = getEnv("PINECONE_INDEX");

const run = async () => {
  validateEnvironmentVariables();
  // Initialize the Pinecone client
  const pineconeClient = await getPineconeClient();

  await pineconeClient.deleteIndex({
    indexName,
  });
};

run();
