import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { array, parse } from 'valibot';

import type { MusicReleaseRecord } from '../../common/schemata.js';
import { releaseRecordSchema } from '../../common/schemata.js';
import isError from '../../helpers/is-error.js';
import normalizeFilename from '../../helpers/normalize-filename.js';

const artistsReleasesSchema = array(releaseRecordSchema);

function isFileNotFoundError(error: unknown): boolean {
  if (!isError(error)) {
    return true;
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
    if (isFileNotFoundError(error)) {
      console.error(error);
      return [];
    } else throw error;
  }
}
