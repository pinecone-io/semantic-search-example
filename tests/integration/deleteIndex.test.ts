import { hasPineconeCredentials, randomizeIndexName } from "../utils/index.js";
import { Pinecone } from "@pinecone-database/pinecone";
import { deleteIndex } from "@src/deleteIndex.js";

describe.skipIf(!hasPineconeCredentials)("Delete", () => {
  const INDEX_NAME = randomizeIndexName("test-index-for-delete");

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(
    async () => {
      process.env.PINECONE_INDEX = INDEX_NAME;

      try {
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string, sourceTag: "pinecone:semantic_search_example" });

        await pinecone.createIndex({
          name: INDEX_NAME,
          dimension: 384,
          spec: {
            serverless: {
              region: "us-west-2",
              cloud: "aws",
            },
          },
          waitUntilReady: true,
          suppressConflicts: true,
        });
      } catch (error) {
        console.error(error);
      }
    }, // Set timeout to 5 mins, because creating index can take time
    5 * 60 * 1000
  );

  afterAll(async () => {
    consoleMock.mockReset();
  });

  it("should delete Pinecone index", async () => {
    await deleteIndex();

    expect(consoleMock).toHaveBeenCalledWith(`Index is deleted: ${INDEX_NAME}`);
  });
});
