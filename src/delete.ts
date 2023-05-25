import { config } from "dotenv";
import { getPineconeClient } from "./pinecone.js";
import utils from "./utils/util.js";
const { getEnv, validateEnvironmentVariables } = utils;
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
