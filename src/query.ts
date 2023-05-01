/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { embedder } from './utils/embeddings'
import { PineconeClient } from '@pinecone-database/pinecone';
import { config } from 'dotenv';
import { validateEnvironmentVariables } from './utils/util';

config()

const pineconeClient = new PineconeClient()

const run = async () => {
  validateEnvironmentVariables();

  // Initialize the client with your Pinecone API key and environment
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  })

  // Insert the embeddings into the index
  const index = pineconeClient.Index('word-embeddings')

  const query = 'How to lessen my stomach blubber through eating better?'
  const queryEmbedding = await embedder.embed(query)

  const results = await index.query({
    queryRequest: {
      vector: queryEmbedding.values,
      topK: 2,
      includeMetadata: true,
      includeValues: false,
      namespace: 'word-embeddings'
    }
  })

  console.log(results.matches)
}

run()