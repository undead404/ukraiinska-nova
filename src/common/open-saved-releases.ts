import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { array, isValiError, parse } from 'valibot';

import normalizeFilename from '../helpers/normalize-filename.js';

import type { MusicReleaseRecord } from './schemata.js';
import { releaseRecordSchema } from './schemata.js';

const artistsReleasesSchema = array(releaseRecordSchema);

function isFileNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || !error || !('code' in error)) {
    return false;
  }
  return error.code === 'ENOENT';
}

export default async function openSavedReleases(
  folder: string,
  artistId: string,
  artistName: string,
): Promise<MusicReleaseRecord[]> {
  console.log(`openSavedReleases("${artistId}", "${artistName}")`);
  const filename = normalizeFilename(`${artistName}-${artistId}.json`);
  const filePath = path.join(folder, filename);
  try {
    const data = await readFile(filePath);
    const releases = parse(artistsReleasesSchema, JSON.parse(data.toString()));
    return releases;
  } catch (error) {
    if (isFileNotFoundError(error) || isValiError(error)) {
      console.error(error);
      return [];
    } else throw error;
  }
}
