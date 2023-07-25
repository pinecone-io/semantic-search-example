import { getPineconeClient } from "@src/pinecone.js";
import { run } from "@src/index.js";
import { createMockOnProcessExit } from "../utils/index.js";

describe(
  "Semantic Search",
  () => {
    const originalArgv = process.argv;
    let INDEX_NAME = process.env.PINECONE_INDEX || "";
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});

    beforeAll(() => {
      // Extend index name with uniqe sufix to ensure that we do not have same index name
      // In case we delete and create multiple times index with same name error will occure:
      // Error upserting chunk [PineconeError: PineconeClient: Error calling upsert: PineconeError: PineconeClient: Error calling upsertRaw: no healthy upstream]
      // Note that this is known bug
      INDEX_NAME += `-${new Date().getTime()}`;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    afterAll(async () => {
      // Deleate index after usage
      await (await getPineconeClient())
        .deleteIndex({ indexName: INDEX_NAME })
        .catch((e) => console.error(e));

      consoleMock.mockReset();
    });

    it("should be able to load new questions and query them", async () => {
      process.env.PINECONE_INDEX = INDEX_NAME;

      // Set env for indexing
      process.argv = [
        "node",
        "../../src/index",
        "l",
        "--csvPath=tests/data/test-1.csv",
        "--column=question1",
      ];

      await run();

      const client = await getPineconeClient();
      const index = client.Index(INDEX_NAME);
      const stats = await index
        .describeIndexStats({
          describeIndexStatsRequest: {},
        })
        .catch((e) => console.error(e));

      // Ensure that all vectors are added
      expect(stats?.namespaces?.default.vectorCount).toBe(4);

      // Set enviroment for querying
      process.argv = [
        "node",
        "../../src/index",
        "q",
        '--query="which city has the highest population in the world?"',
        "--topK=2",
      ];

      await run();
    });

    it("should exit if index csvPath is empty", async () => {
      const mockExit = createMockOnProcessExit();

      process.argv = [
        "node",
        "../../src/index",
        "l",
        "--csvPath",
        "--column=question1",
      ];

      await expect(run()).rejects.toThrow("process.exit: 1");

      expect(mockExit).toBeCalledWith(1);

      mockExit.mockRestore();
    });

    it("should exit if q is empty in query command", async () => {
      const mockExit = createMockOnProcessExit();

      process.argv = ["node", "../../src/index", "q", "-q", "-k=2"];

      await expect(run()).rejects.toThrow("process.exit: 1");

      expect(mockExit).toBeCalledWith(1);

      mockExit.mockRestore();
    });

    it("should log an error if delte is called without valid index name", async () => {
      process.env.PINECONE_INDEX = "some-non-exiting-index";
      process.argv = ["node", "../../src/index", "delete"];

      await run();
      expect(consoleMock).toHaveBeenCalledWith(
        "PineconeError: PineconeClient: Error calling deleteIndex: 404: Not Found"
      );
    });
  },
  // Set timeout to 5 mins, becouse creating index can take time
  5 * 60 * 1000
);
