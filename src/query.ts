import { config } from "dotenv";
import { embedder } from "./embeddings";
import { getPineconeClient } from "./pinecone";
import {
  getEnv,
  getQueryingCommandLineArguments,
  validateEnvironmentVariables,
} from "./utils/util";

config();
const indexName = getEnv("PINECONE_INDEX");

const run = async () => {
  validateEnvironmentVariables();

  // Get arguments from the command line
  const { query, topK } = getQueryingCommandLineArguments();

  // Initialize the Pinecone client
  const pineconeClient = await getPineconeClient();

  // Select the target Pinecone index
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
