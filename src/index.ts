/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fs from 'fs'
import { embedder } from './utils/embeddings'
import { chunkedUpsert, createIndexIfNotExists, getPineconeClient } from './utils/pinecone';
import { config } from 'dotenv';
import { loadCSVFile } from './utils/csvLoader';
import { getCommandLineArguments } from './utils/util';
import cliProgress from 'cli-progress'
config()

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const indexName = process.env.PINECONE_INDEX!
let counter = 0;

const run = async () => {
  const pineconeClient = await getPineconeClient()

  const { csvPath, column } = getCommandLineArguments();

  // Get csv file absolute path
  const csvAbsolutePath = fs.realpathSync(csvPath)

  // Create a readable stream from the CSV file
  const { data, meta } = await loadCSVFile(csvAbsolutePath)

  // Ensure the selected column exists in the CSV file
  if (!meta.fields?.includes(column)) {
    console.error(`Column ${column} not found in CSV file`)
    process.exit(1)
  }

  // Extract the selected column from the CSV file
  const documents = data.map((row) => row[column] as string)

  // Create a Pinecone index with the name "word-embeddings" and a dimension of 384
  await createIndexIfNotExists(pineconeClient, indexName, 384)

  // Select the target Pinecone index
  const index = pineconeClient.Index(indexName)

  progressBar.start(documents.length, 0);

  // Start the batch embedding process
  await embedder.init()
  await embedder.embedBatch(documents, 1000, async (embeddings) => {
    counter += embeddings.length
    //Whenever the batch embedding process returns a batch of embeddings, insert them into the index
    await chunkedUpsert(index, embeddings, indexName)
    progressBar.update(counter);
  })

  progressBar.stop();
  console.log(`Inserted ${documents.length} documents into index ${indexName}`)
}

run()