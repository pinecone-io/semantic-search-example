import { config } from "dotenv";
import { getPineconeClient } from "./pinecone";
import {
  getEnv,
  validateEnvironmentVariables,
} from "./utils/util";

config();
const indexName = getEnv("PINECONE_INDEX");

const run = async () => {
  validateEnvironmentVariables();
  // Initialize the Pinecone client
  const pineconeClient = await getPineconeClient();

  await pineconeClient.deleteIndex({
    indexName
  });
};

run();
