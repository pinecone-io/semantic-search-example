/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { embedder } from "./embeddings";
import { config } from "dotenv";
import {
  getQueryingCommandLineArguments,
  validateEnvironmentVariables,
} from "./utils/util";
import { getPineconeClient } from "./pinecone";

config();
const indexName = process.env.PINECONE_INDEX!;

const run = async () => {
  validateEnvironmentVariables();
  const pineconeClient = await getPineconeClient();
  const { query, topK } = getQueryingCommandLineArguments();

  // Insert the embeddings into the index
  const index = pineconeClient.Index(indexName);
  // Initialize the embedder
  await embedder.init();
  // Embed the query
  const queryEmbedding = await embedder.embed(query);

  // Query the index
  const results = await index.query({
    queryRequest: {
      vector: queryEmbedding.values,
      topK,
      includeMetadata: true,
      includeValues: false,
      namespace: "default",
    },
  });

  console.log(
    results.matches?.map((match) => ({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      text: match.metadata?.text,
      score: match.score,
    }))
  );
};

run();
