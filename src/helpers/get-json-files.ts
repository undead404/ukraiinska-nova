import { readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Get all JSON file paths from a folder (shallow, non-recursive)
 */
export default async function getJsonFiles(
  folderPath: string,
): Promise<string[]> {
  try {
    const files = await readdir(folderPath);

    return files
      .filter((file) => path.extname(file).toLowerCase() === '.json')
      .map((file) => path.join(folderPath, file));
  } catch (error) {
    console.error(`Error reading folder ${folderPath}:`, error);
    return [];
  }
}
