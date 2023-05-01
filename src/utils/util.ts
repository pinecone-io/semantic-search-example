const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize)
  );
};

const validateEnvironmentVariables = () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  }

  if (!process.env.PINECONE_ENVIRONMENT) {
    throw new Error('PINECONE_ENVIRONMENT environment variable not set');
  }
};


export { sliceIntoChunks, validateEnvironmentVariables };