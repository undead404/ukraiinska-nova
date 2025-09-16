import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MusicReleaseRecord } from '../../common/schemata.js';
import { RELEASES_DATA_FOLDER } from '../../constants.js';
import normalizeFilename from '../../helpers/normalize-filename.js';

export default async function saveReleases(
  artistId: string,
  artistName: string,
  releases: MusicReleaseRecord[],
) {
  const filename = normalizeFilename(`${artistName}-${artistId}.json`);
  const filePath = path.join(...RELEASES_DATA_FOLDER, filename);
  await writeFile(filePath, JSON.stringify(releases, undefined, 2));
}
