import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MusicReleaseRecord } from '../../common/schemata.js';
import normalizeFilename from '../../helpers/normalize-filename.js';
import stringifyWithSort from '../../helpers/stringify-with-sort.js';

export default async function saveReleases(
  folder: string,
  artistId: string,
  artistName: string,
  releases: MusicReleaseRecord[],
) {
  const filename = normalizeFilename(`${artistName}-${artistId}.json`);
  const filePath = path.join(folder, filename);
  await writeFile(filePath, stringifyWithSort(releases, { space: 2 }));
}
