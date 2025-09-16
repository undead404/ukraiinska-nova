import { readFile } from 'node:fs/promises';
import path from 'node:path';

import getReleaseAppearanceTime from 'src/helpers/get-release-appearance-time.js';
import { array, parse } from 'valibot';

import type { MusicRelease } from '../../common/schemata.js';
import { releaseRecordSchema } from '../../common/schemata.js';
import { RELEASES_DATA_FOLDER } from '../../constants.js';
import getJsonFiles from '../../helpers/get-json-files.js';

export default async function* getTodayReleases(): AsyncGenerator<MusicRelease> {
  const artistFiles = await getJsonFiles(path.join(...RELEASES_DATA_FOLDER));
  const today = new Date().toDateString();
  for (const artistFileName of artistFiles) {
    const data = await readFile(
      path.join(...RELEASES_DATA_FOLDER, artistFileName),
    );
    const releases = parse(array(releaseRecordSchema), data);
    for (const release of releases) {
      const releaseAppearanceTime = getReleaseAppearanceTime(release);
      if (releaseAppearanceTime?.toDateString() === today) {
        yield release;
      }
    }
  }
}
