import cliProgress from "cli-progress";
import { config } from "dotenv";
import loadCSVFile from "./csvLoader.js";

import { embedder } from "./embeddings.js";
import {
  Pinecone,
  type ServerlessSpecCloudEnum,
} from "@pinecone-database/pinecone";
import { getEnv, validateEnvironmentVariables } from "./utils/util.js";

import type { TextMetadata } from "./types.js";

// Load environment variables from .env
config();

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

let counter = 0;

export const load = async (csvPath: string, column: string) => {
  validateEnvironmentVariables();

  // Get a Pinecone instance
  const pinecone = new Pinecone();

  // Create a readable stream from the CSV file
  const { data, meta } = await loadCSVFile(csvPath);

  // Ensure the selected column exists in the CSV file
  if (!meta.fields?.includes(column)) {
    console.error(`Column ${column} not found in CSV file`);
    process.exit(1);
  }

  // Extract the selected column from the CSV file
  const documents = data.map((row) => row[column] as string);

  // Get index name, cloud, and region
  const indexName = getEnv("PINECONE_INDEX");
  const indexCloud = getEnv("PINECONE_CLOUD") as ServerlessSpecCloudEnum;
  const indexRegion = getEnv("PINECONE_REGION");

  // Create a Pinecone index with a dimension of 384 to hold the outputs
  // of our embeddings model. Use suppressConflicts in case the index already exists.
  await pinecone.createIndex({
    name: indexName,
    dimension: 384,
    spec: {
      serverless: {
        region: indexRegion,
        cloud: indexCloud,
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });

  // Select the target Pinecone index. Passing the TextMetadata generic type parameter
  // allows typescript to know what shape to expect when interacting with a record's
  // metadata field without the need for additional type casting.
  const index = pinecone.index<TextMetadata>(indexName);

  // Start the progress bar
  progressBar.start(documents.length, 0);

  // Start the batch embedding process
  await embedder.init();
  await embedder.embedBatch(documents, 100, async (embeddings) => {
    counter += embeddings.length;
    console.log(embeddings.length);
    // Whenever the batch embedding process returns a batch of embeddings, insert them into the index
    await index.upsert(embeddings);
    progressBar.update(counter);
  });

  progressBar.stop();
  console.log(`Inserted ${documents.length} documents into index ${indexName}`);
};
