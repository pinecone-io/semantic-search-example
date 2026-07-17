// Captured before any dummy fallback is applied so integration tests can
// self-skip when real Pinecone credentials aren't available, while still
// letting modules that validate env vars at import time (src/query.ts,
// src/deleteIndex.ts) load without crashing the test file.
export const hasPineconeCredentials = !!process.env.PINECONE_API_KEY;

process.env.PINECONE_API_KEY ??= "test-api-key";
process.env.PINECONE_INDEX ??= "test-index";
process.env.PINECONE_CLOUD ??= "aws";
process.env.PINECONE_REGION ??= "us-west-2";
