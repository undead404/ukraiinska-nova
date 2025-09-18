import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MusicReleaseRecord } from '../../common/schemata.js';
import { RELEASES_DATA_FOLDER } from '../../constants.js';
import normalizeFilename from '../../helpers/normalize-filename.js';
import stringifyWithSort from '../../helpers/stringify-with-sort.js';

export default async function saveReleases(
  artistId: string,
  artistName: string,
  releases: MusicReleaseRecord[],
) {
  const filename = normalizeFilename(`${artistName}-${artistId}.json`);
  const filePath = path.join(...RELEASES_DATA_FOLDER, filename);
  await writeFile(filePath, stringifyWithSort(releases, { space: 2 }));
}
