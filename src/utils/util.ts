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

const getCommandLineArguments = () => {
  const csvPath = process.argv[3];
  const column = process.argv[4];

  if (!csvPath) {
    console.error("Please provide a CSV path");
    process.exit(1);
  }

  return { csvPath, column };
};

export {
  sliceIntoChunks,
  validateEnvironmentVariables,
  getCommandLineArguments,
};
