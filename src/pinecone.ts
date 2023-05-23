/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PineconeClient } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import { validateEnvironmentVariables } from "./utils/util";

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
