import { utils } from "@pinecone-database/pinecone";
import { getPineconeClient } from "@src/pinecone.js";
import { deleteIndex } from "@src/deleteIndex.js";

describe("Delete", () => {
  const INDEX_NAME = "test-index-for-delete";
  
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(
    async () => {
      process.env.PINECONE_INDEX = INDEX_NAME;
      await utils
        .createIndexIfNotExists(await getPineconeClient(), INDEX_NAME, 384)
        .then(
          // Give a little more space for index to be up and running
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
    }, // Set timeout to 5 mins, becouse creating index can take time
    5 * 60 * 1000
  );

  afterAll(() => {
    consoleMock.mockReset();
  });

  it("should delete Pinecone index", async () => {
    await deleteIndex();

    expect(consoleMock).toHaveBeenCalledWith(`Index is deleted: ${INDEX_NAME}`);
  });
});
