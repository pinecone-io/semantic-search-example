import fs from "fs/promises";
import Papa from "papaparse";

async function loadCSVFile(
  filePath: string,
): Promise<Papa.ParseResult<Record<string, unknown>>> {
  try {
    // Get csv file absolute path
    const absolutePath = await fs.realpath(filePath);

    // Read file content
    const fileContent = await fs.readFile(absolutePath, "utf8");

    // Parse csv content
    const parseResult = Papa.parse<Record<string, unknown>>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    return parseResult;
  } catch (error) {
    throw error;
  }
}

export { loadCSVFile };
