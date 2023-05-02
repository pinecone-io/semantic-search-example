/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { embedder } from "./utils/embeddings";
import { config } from "dotenv";
import { validateEnvironmentVariables } from "./utils/util";
import { getPineconeClient } from "./utils/pinecone";

config();

const run = async () => {
  validateEnvironmentVariables();
  const pineconeClient = await getPineconeClient();

  // Insert the embeddings into the index
  const index = pineconeClient.Index("word-embeddings");

  const query = "How to lessen my stomach blubber through eating better?";
  const queryEmbedding = await embedder.embed(query);

  const results = await index.query({
    queryRequest: {
      vector: queryEmbedding.values,
      topK: 2,
      includeMetadata: true,
      includeValues: false,
      namespace: "word-embeddings",
    },
  });

  console.log(results.matches);
};

run();
