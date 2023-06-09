import { utils } from "@pinecone-database/pinecone";
import cliProgress from "cli-progress";
import { config } from "dotenv";
import loadCSVFile from "./csvLoader.js";

import { embedder } from "./embeddings.js";
import { getPineconeClient } from "./pinecone.js";
import { getEnv, getIndexingCommandLineArguments } from "./utils/util.js";
const { createIndexIfNotExists, chunkedUpsert } = utils;
config();

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const indexName = getEnv("PINECONE_INDEX");
let counter = 0;

const run = async () => {
  // Get the CSV path and column name from the command line arguments
  const { csvPath, column } = getIndexingCommandLineArguments();

  // Get a PineconeClient instance
  const pineconeClient = await getPineconeClient();

  // Create a readable stream from the CSV file
  const { data, meta } = await loadCSVFile(csvPath);

  // Ensure the selected column exists in the CSV file
  if (!meta.fields?.includes(column)) {
    console.error(`Column ${column} not found in CSV file`);
    process.exit(1);
  }

  // Extract the selected column from the CSV file
  const documents = data.map((row) => row[column] as string);

  // Create a Pinecone index with the name "word-embeddings" and a dimension of 384
  await createIndexIfNotExists(pineconeClient, indexName, 384);

  // Select the target Pinecone index
  const index = pineconeClient.Index(indexName);

  // Start the progress bar
  progressBar.start(documents.length, 0);

  // Start the batch embedding process
  await embedder.init();
  await embedder.embedBatch(documents, 1, async (embeddings) => {
    counter += embeddings.length;
    //Whenever the batch embedding process returns a batch of embeddings, insert them into the index
    await chunkedUpsert(index, embeddings, "default");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    progressBar.update(counter);
  });

  progressBar.stop();
  console.log(`Inserted ${documents.length} documents into index ${indexName}`);
};

run();
