import loadCSVFile from "@src/csvLoader.js";

describe("loadCSVFile", () => {
  it("parses rows and header fields from a CSV file", async () => {
    const { data, meta } = await loadCSVFile("./tests/data/test_small.csv");

    expect(meta.fields).toEqual(["test_id", "question1", "question2"]);
    expect(data).toHaveLength(4);
    expect(data[0]).toEqual(
      expect.objectContaining({
        test_id: 0,
        question1: "How does the Surface Pro himself 4 compare with iPad Pro?",
      })
    );
  });

  it("rejects when the file does not exist", async () => {
    await expect(loadCSVFile("non-existing.csv")).rejects.toThrow(
      "ENOENT: no such file or directory, realpath 'non-existing.csv'"
    );
  });
});
