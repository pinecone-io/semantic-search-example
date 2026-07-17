import { createMockOnProcessExit } from "../utils/index.js";

const { upsertMock, createIndexMock, indexMock, embedMock } = vi.hoisted(() => {
  const upsertMock = vi.fn();
  const createIndexMock = vi.fn();
  const indexMock = vi.fn(() => ({ upsert: upsertMock }));
  const embedMock = vi.fn(async (text: string) => ({
    id: `id-${text}`,
    metadata: { text },
    values: [0.1, 0.2, 0.3],
  }));
  return { upsertMock, createIndexMock, indexMock, embedMock };
});

vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: vi.fn().mockImplementation(function PineconeMock() {
    return {
      createIndex: createIndexMock,
      index: indexMock,
    };
  }),
}));

vi.mock("@src/embeddings.js", () => ({
  embedder: {
    init: vi.fn(async () => undefined),
    embed: embedMock,
    embedBatch: vi.fn(
      async (texts: string[], _batchSize: number, onDoneBatch) => {
        const embeddings = await Promise.all(
          texts.map((text) => embedMock(text))
        );
        await onDoneBatch(embeddings);
      }
    ),
  },
}));

import { load } from "@src/load.js";

describe("load (mocked)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PINECONE_API_KEY = "test-key";
    process.env.PINECONE_INDEX = "test-index";
    process.env.PINECONE_CLOUD = "aws";
    process.env.PINECONE_REGION = "us-west-2";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("creates the index and upserts an embedding for every row", async () => {
    await load("./tests/data/test_small.csv", "question1");

    expect(createIndexMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test-index",
        dimension: 384,
        spec: { serverless: { region: "us-west-2", cloud: "aws" } },
      })
    );
    expect(indexMock).toHaveBeenCalledWith("test-index");
    expect(upsertMock).toHaveBeenCalledTimes(1);

    const [{ records }] = upsertMock.mock.calls[0];
    expect(records).toHaveLength(4);
    expect(records[0]).toEqual(
      expect.objectContaining({
        metadata: { text: expect.any(String) },
        values: [0.1, 0.2, 0.3],
      })
    );
  });

  it("rejects when the CSV file path is incorrect", async () => {
    await expect(load("non-existing.csv", "question1")).rejects.toThrow(
      "ENOENT: no such file or directory, realpath 'non-existing.csv'"
    );
    expect(createIndexMock).not.toHaveBeenCalled();
  });

  it("exits when the requested column is not in the CSV file", async () => {
    const mockExit = createMockOnProcessExit();

    await expect(
      load("./tests/data/test_small.csv", "question6")
    ).rejects.toThrow("process.exit: 1");

    expect(mockExit).toBeCalledWith(1);
    expect(createIndexMock).not.toHaveBeenCalled();

    mockExit.mockRestore();
  });

  it("complains if required env variables are not set", async () => {
    process.env = {};

    await expect(load("non-existing.csv", "question1")).rejects.toThrow(
      "PINECONE_API_KEY environment variable not set"
    );
  });
});
