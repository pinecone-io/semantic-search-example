import "./testEnv.js";

const { deleteIndexMock } = vi.hoisted(() => ({
  deleteIndexMock: vi.fn(),
}));

vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: vi.fn().mockImplementation(function PineconeMock() {
    return { deleteIndex: deleteIndexMock };
  }),
}));

import { deleteIndex } from "@src/deleteIndex.js";

describe("deleteIndex (mocked)", () => {
  const originalEnv = { ...process.env };

  const consoleLogMock = vi
    .spyOn(console, "log")
    .mockImplementation(() => undefined);
  const consoleErrorMock = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    process.env.PINECONE_INDEX = "test-index";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("deletes the configured index and logs success", async () => {
    deleteIndexMock.mockResolvedValueOnce(undefined);

    await deleteIndex();

    expect(deleteIndexMock).toHaveBeenCalledWith("test-index");
    expect(consoleLogMock).toHaveBeenCalledWith("Index is deleted: test-index");
  });

  it("logs the error when deletion fails", async () => {
    deleteIndexMock.mockRejectedValueOnce(new Error("index not found"));

    await deleteIndex();

    expect(consoleErrorMock).toHaveBeenCalledWith("Error: index not found");
  });
});
