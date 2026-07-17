// Imported before the modules under test so that the module-level
// `validateEnvironmentVariables()` calls in src/query.ts and src/deleteIndex.ts
// see a fully-populated (dummy) environment at import time, without requiring
// real Pinecone credentials.
process.env.PINECONE_API_KEY ??= "test-api-key";
process.env.PINECONE_INDEX ??= "test-index";
process.env.PINECONE_CLOUD ??= "aws";
process.env.PINECONE_REGION ??= "us-west-2";
