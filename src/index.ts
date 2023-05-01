/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fs from 'fs'
import { embedder } from './utils/embeddings'
import { PineconeClient } from '@pinecone-database/pinecone';
import { chunkedUpsert, createIndexIfNotExists } from './utils/pinecone';
import { config } from 'dotenv';
import { loadCSVFile } from './utils/csvLoader';
import { validateEnvironmentVariables } from './utils/util';

config()

const pineconeClient = new PineconeClient()



const getCommandLineArguments = () => {
  const csvPath = process.argv[3];
  const column = process.argv[4];

  if (!csvPath) {
    console.error('Please provide a CSV path');
    process.exit(1);
  }

  return { csvPath, column };
};

const run = async () => {
  validateEnvironmentVariables();
  // Initialize the client with your Pinecone API key and environment
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  });

  const { csvPath, column } = getCommandLineArguments();

  // Get csv file absolute path
  const csvAbsolutePath = fs.realpathSync(csvPath)

  // Create a readable stream from the CSV file
  const { data, meta } = await loadCSVFile(csvAbsolutePath)

  if (!meta.fields?.includes(column)) {
    console.error(`Column ${column} not found in CSV file`)
    process.exit(1)
  }

  const documents = data.map((row) => row[column] as string)

  // Create a Pinecone index with the name "word-embeddings" and a dimension of 384
  await createIndexIfNotExists(pineconeClient, 'word-embeddings', 384)

  // Insert the embeddings into the index
  const index = pineconeClient.Index('word-embeddings')

  // Embed the documents
  await embedder.init()
  await embedder.embedBatch(documents, 1000, async (embeddings) => {
    await chunkedUpsert(index, embeddings, 'word-embeddings')
  })

  console.log(`Inserted ${documents.length} documents into index 'word-embeddings'`)
}

run()