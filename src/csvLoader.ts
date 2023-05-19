import Papa from "papaparse";
import fs from "fs/promises";

async function loadCSVFile(
  filePath: string
): Promise<Papa.ParseResult<Record<string, unknown>>> {
  try {
    const data = await fs.readFile(filePath, "utf8");
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
