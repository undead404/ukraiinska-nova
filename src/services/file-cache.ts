import { mkdir, readFile, stat, writeFile } from 'fs/promises';

import normalizeFilename from '../helpers/normalize-filename.js';

const CACHE_FOLDER = './cache';

type CacheEntry<T> = {
  data: T;
  endDate: number; // timestamp when the cache entry expires
};

// create cache folder if not exists
if (!(await stat(CACHE_FOLDER).catch(() => false))) {
  await mkdir(CACHE_FOLDER);
}

export async function readFromFileCache<T>(key: string): Promise<T | null> {
  const filePath = `${CACHE_FOLDER}/${normalizeFilename(key)}.json`;
  if (!(await stat(filePath).catch(() => false))) {
    return null;
  }

  const { data, endDate } = await readFile(filePath, 'utf-8').then(
    (content) => JSON.parse(content) as CacheEntry<T>,
  );
  if (endDate < Date.now()) {
    return null;
  }
  return data as T;
}

export async function writeToFileCache<T>(
  key: string,
  data: T,
  endDate: number,
): Promise<void> {
  const filePath = `${CACHE_FOLDER}/${normalizeFilename(key)}.json`;

  await writeFile(
    filePath,
    JSON.stringify({ data, endDate }, null, 2),
    'utf-8',
  );
}
