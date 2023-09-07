import { createMockOnProcessExit } from "../utils/index.js";
import { load } from "@src/load.js";

describe("Load", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should produce error in case csv file path is incorect", async () => {
    await expect(load("non-existing.csv", "question1")).rejects.toThrow(
      "ENOENT: no such file or directory, realpath 'non-existing.csv'"
    );
  });

  it("should exit in case index params are is not valid", async () => {
    const mockExit = createMockOnProcessExit();

    await expect(
      load("./tests/data/test_small.csv", "question6")
    ).rejects.toThrow("process.exit: 1");

    expect(mockExit).toBeCalledWith(1);

    mockExit.mockRestore();
  });

  it("should complain if env variables are not set", async () => {
    process.env = {};

    await expect(load("non-existing.csv", "question1")).rejects.toThrow(
      "PINECONE_API_KEY environment variable not set"
    );
  });
});
