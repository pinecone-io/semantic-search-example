/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IndexMeta, PineconeClient, Vector } from "@pinecone-database/pinecone";
import { VectorOperationsApi } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { config } from "dotenv";
import { sliceIntoChunks, validateEnvironmentVariables } from "./utils/util";

config();

let pineconeClient: PineconeClient | null = null;

// Returns a PineconeClient instance
export const getPineconeClient: () => Promise<PineconeClient> = async () => {
  validateEnvironmentVariables();

  if (pineconeClient) {
    return pineconeClient;
  } else {
    pineconeClient = new PineconeClient();

    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
  }
  return pineconeClient;
};

// Waits until the index is ready
export const waitUntilIndexIsReady = async (
  client: PineconeClient,
  indexName: string
) => {
  try {
    const indexDescription: IndexMeta = await client.describeIndex({
      indexName,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!indexDescription.status?.ready) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 1000));
      await waitUntilIndexIsReady(client, indexName);
    } else {
      return;
    }
  } catch (e) {
    console.error("Error waiting until index is ready", e);
  }
};

// Creates an index if it doesn't exist
export const createIndexIfNotExists = async (
  client: PineconeClient,
  indexName: string,
  dimension: number
) => {
  try {
    const indexList = await client.listIndexes();
    if (!indexList.includes(indexName)) {
      console.log("Creating index", indexName);
      await client.createIndex({
        createRequest: {
          name: indexName,
          dimension,
        },
      });
      console.log("Waiting until index is ready...");
      await waitUntilIndexIsReady(client, indexName);
      console.log("Index is ready.");
    }
  } catch (e) {
    console.error("Error creating index", e);
  }
};

// Upserts vectors into the index in chunks
export const chunkedUpsert = async (
  index: VectorOperationsApi,
  vectors: Vector[],
  namespace: string,
  chunkSize = 10
) => {
  // Split the vectors into chunks
  const chunks = sliceIntoChunks<Vector>(vectors, chunkSize);

  try {
    // Upsert each chunk of vectors into the index
    await Promise.allSettled(
      chunks.map(async (chunk) => {
        try {
          await index.upsert({
            upsertRequest: {
              vectors: chunk as Vector[],
              namespace,
            },
          });
        } catch (e) {
          console.log("Error upserting chunk", e);
        }
      })
    );

    return true;
  } catch (e) {
    throw new Error(`Error upserting vectors into index: ${e}`);
  }
};
