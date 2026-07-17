import "./testEnv.js";

const { queryMock, indexMock, embedMock } = vi.hoisted(() => {
  const queryMock = vi.fn(async () => ({
    matches: [
      { metadata: { text: "closest match" }, score: 0.9 },
      { metadata: { text: "second match" }, score: 0.5 },
    ],
  }));
  const indexMock = vi.fn(() => ({ query: queryMock }));
  const embedMock = vi.fn(async () => ({ values: [0.1, 0.2, 0.3] }));
  return { queryMock, indexMock, embedMock };
});

vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: vi.fn().mockImplementation(function PineconeMock() {
    return { index: indexMock };
  }),
}));

vi.mock("@src/embeddings.js", () => ({
  embedder: {
    init: vi.fn(async () => undefined),
    embed: embedMock,
  },
}));

import { query } from "@src/query.js";

describe("query (mocked)", () => {
  const originalEnv = { ...process.env };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {});

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

  it("embeds the query and prints the matched text and score", async () => {
    await query("which city has the highest population?", 2);

    expect(embedMock).toHaveBeenCalledWith(
      "which city has the highest population?"
    );
    expect(indexMock).toHaveBeenCalledWith("test-index");
    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vector: [0.1, 0.2, 0.3],
        topK: 2,
        includeMetadata: true,
        includeValues: false,
      })
    );
    expect(consoleMock).toHaveBeenCalledWith([
      { text: "closest match", score: 0.9 },
      { text: "second match", score: 0.5 },
    ]);
  });
});
