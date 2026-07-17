import "./testEnv.js";

const { loadMock, queryMock, deleteIndexMock } = vi.hoisted(() => ({
  loadMock: vi.fn(async () => undefined),
  queryMock: vi.fn(async () => undefined),
  deleteIndexMock: vi.fn(async () => undefined),
}));

vi.mock("@src/load.js", () => ({ load: loadMock }));
vi.mock("@src/query.js", () => ({ query: queryMock }));
vi.mock("@src/deleteIndex.js", () => ({ deleteIndex: deleteIndexMock }));

import { run } from "@src/index.js";
import { createMockOnProcessExit } from "../utils/index.js";

describe("CLI arg parsing (mocked)", () => {
  const originalArgv = [...process.argv];

  afterEach(() => {
    process.argv = [...originalArgv];
    vi.clearAllMocks();
  });

  it("parses the load command and forwards csvPath/column to load()", async () => {
    process.argv = [
      "node",
      "../../src/index",
      "l",
      "--csvPath=tests/data/test_small.csv",
      "--column=question1",
    ];

    await run();

    expect(loadMock).toHaveBeenCalledWith(
      "tests/data/test_small.csv",
      "question1"
    );
  });

  it("exits without calling load() when csvPath is missing", async () => {
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
    expect(loadMock).not.toHaveBeenCalled();

    mockExit.mockRestore();
  });

  it("parses the query command and forwards query/topK to query()", async () => {
    process.argv = [
      "node",
      "../../src/index",
      "q",
      "--query=highest population",
      "--topK=2",
    ];

    await run();

    expect(queryMock).toHaveBeenCalledWith("highest population", 2);
  });

  it("exits without calling query() when the query text is empty", async () => {
    const mockExit = createMockOnProcessExit();

    process.argv = ["node", "../../src/index", "q", "-q", "-k=2"];

    await expect(run()).rejects.toThrow("process.exit: 1");

    expect(mockExit).toBeCalledWith(1);
    expect(queryMock).not.toHaveBeenCalled();

    mockExit.mockRestore();
  });

  it("parses the delete command and calls deleteIndex()", async () => {
    process.argv = ["node", "../../src/index", "delete"];

    await run();

    expect(deleteIndexMock).toHaveBeenCalledTimes(1);
  });
});
