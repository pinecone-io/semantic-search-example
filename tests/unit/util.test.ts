import {
  getEnv,
  sliceIntoChunks,
  validateEnvironmentVariables,
} from "@src/utils/util.js";

describe("sliceIntoChunks", () => {
  it("splits an array into chunks of the given size", () => {
    expect(sliceIntoChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when the array is smaller than the chunk size", () => {
    expect(sliceIntoChunks(["a", "b"], 10)).toEqual([["a", "b"]]);
  });

  it("returns an empty array when given an empty array", () => {
    expect(sliceIntoChunks([], 5)).toEqual([]);
  });

  it("returns exactly-sized chunks when the array divides evenly", () => {
    expect(sliceIntoChunks([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});

describe("getEnv", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns the value of a set environment variable", () => {
    process.env = { ...originalEnv, MY_TEST_VAR: "hello" };
    expect(getEnv("MY_TEST_VAR")).toEqual("hello");
  });

  it("throws when the environment variable is not set", () => {
    process.env = { ...originalEnv };
    delete process.env.MY_UNSET_VAR;
    expect(() => getEnv("MY_UNSET_VAR")).toThrow(
      "MY_UNSET_VAR environment variable not set"
    );
  });
});

describe("validateEnvironmentVariables", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("does not throw when all required variables are set", () => {
    process.env = {
      ...originalEnv,
      PINECONE_API_KEY: "key",
      PINECONE_INDEX: "index",
      PINECONE_CLOUD: "aws",
      PINECONE_REGION: "us-west-2",
    };
    expect(() => validateEnvironmentVariables()).not.toThrow();
  });

  it("throws naming the first missing required variable", () => {
    process.env = {
      ...originalEnv,
      PINECONE_INDEX: "index",
      PINECONE_CLOUD: "aws",
      PINECONE_REGION: "us-west-2",
    };
    delete process.env.PINECONE_API_KEY;
    expect(() => validateEnvironmentVariables()).toThrow(
      "PINECONE_API_KEY environment variable not set"
    );
  });
});
