const { pipelineFactoryMock, pipeMock } = vi.hoisted(() => ({
  pipelineFactoryMock: vi.fn(),
  pipeMock: vi.fn(async (text: string) => ({
    data: Float32Array.from([text.length, 1, 2]),
  })),
}));

vi.mock("@xenova/transformers", () => ({
  pipeline: pipelineFactoryMock,
}));

import { embedder } from "@src/embeddings.js";

describe("embedder (mocked)", () => {
  beforeEach(() => {
    pipelineFactoryMock.mockReset();
    pipelineFactoryMock.mockResolvedValue(pipeMock);
  });

  it("initializes the pipeline with the MiniLM model", async () => {
    await embedder.init();

    expect(pipelineFactoryMock).toHaveBeenCalledWith(
      "embeddings",
      "Xenova/all-MiniLM-L6-v2"
    );
  });

  it("embeds a single string into a PineconeRecord", async () => {
    await embedder.init();

    const record = await embedder.embed("hi");

    expect(record.id).toEqual(expect.any(String));
    expect(record.metadata).toEqual({ text: "hi" });
    expect(record.values).toEqual([2, 1, 2]);
  });

  it("embeds in batches and invokes the callback once per batch", async () => {
    await embedder.init();
    const onDoneBatch = vi.fn();

    await embedder.embedBatch(["a", "bb", "ccc"], 2, onDoneBatch);

    expect(onDoneBatch).toHaveBeenCalledTimes(2);
    expect(onDoneBatch.mock.calls[0][0]).toHaveLength(2);
    expect(onDoneBatch.mock.calls[1][0]).toHaveLength(1);
  });
});
