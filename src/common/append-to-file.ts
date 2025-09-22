import { appendFile } from 'node:fs/promises';

import isError from '../helpers/is-error.js';

/**
 * Modern async/await version using fs/promises (Node.js 14+)
 * @param newline New line to append to the file
 * @param filename Path to the file to append to
 * @returns Promise that resolves when the operation is complete
 */
export async function appendToFile(
  newline: string,
  filename: string,
): Promise<void> {
  try {
    // Ensure the newline ends with a line break
    const lineToAppend = newline.endsWith('\n') ? newline : newline + '\n';
    await appendFile(filename, lineToAppend, 'utf8');
  } catch (error) {
    const errorMessage = isError(error) ? error.message : 'Unknown';
    throw new Error(`Failed to append to file ${filename}: ${errorMessage}`);
  }
}
