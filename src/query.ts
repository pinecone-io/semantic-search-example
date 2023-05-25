import { config } from "dotenv";
import { embedder } from "./embeddings.js";
import { getPineconeClient } from "./pinecone.js";
import {
  getEnv,
  getQueryingCommandLineArguments,
  validateEnvironmentVariables,
} from "./utils/util.js";

config();
const indexName = getEnv("PINECONE_INDEX");

const run = async () => {
  validateEnvironmentVariables();
  const pineconeClient = await getPineconeClient();
  const { query, topK } = getQueryingCommandLineArguments();

  // Insert the embeddings into the index
  const index = pineconeClient.Index(indexName);
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

  // Print the results
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
