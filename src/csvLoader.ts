import fs from "fs/promises";
import Papa from "papaparse";

async function loadCSVFile(
  filePath: string
): Promise<Papa.ParseResult<Record<string, unknown>>> {
  try {
    const csvAbsolutePath = await fs.realpath(filePath);
    const data = await fs.readFile(csvAbsolutePath, "utf8");
    return await Papa.parse(data, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export { loadCSVFile };
