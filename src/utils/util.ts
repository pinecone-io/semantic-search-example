import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize)
  );
};

const validateEnvironmentVariables = () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY environment variable not set");
  }

  if (!process.env.PINECONE_ENVIRONMENT) {
    throw new Error("PINECONE_ENVIRONMENT environment variable not set");
  }

  if (!process.env.PINECONE_INDEX) {
    throw new Error("PINECONE_INDEX environment variable not set");
  }
};

const getIndexingCommandLineArguments = () => {
  const argv = yargs(hideBin(process.argv))
    .option("csvPath", {
      alias: "p",
      type: "string",
      description: "Path to your CSV path",
      demandOption: true,
    })
    .option("column", {
      alias: "c",
      type: "string",
      description: "The name for the CSV column",
      demandOption: true,
    })
    .parseSync();

  const { csvPath, column } = argv;

  if (!csvPath) {
    console.error("Please provide a CSV path");
    process.exit(1);
  }

  return { csvPath, column };
};

const getQueryingCommandLineArguments = () => {
  const argv = yargs(hideBin(process.argv))
    .option("query", {
      alias: "q",
      type: "string",
      description: "Your query",
      demandOption: true,
    })
    .option("topK", {
      alias: "k",
      type: "number",
      description: "number of results to return",
      demandOption: true,
    })

    .parseSync();

  const { query, topK } = argv;
  if (!query) {
    console.error("Please provide a query");
    process.exit(1);
  }

  return { query, topK };
};

export {
  sliceIntoChunks,
  validateEnvironmentVariables,
  getIndexingCommandLineArguments,
  getQueryingCommandLineArguments,
};
