import { readFile } from 'node:fs/promises';

import { array, parse } from 'valibot';

import enhanceRelease from '../../common/enhance-release.js';
import { releaseRecordSchema } from '../../common/schemata.js';
import getJsonFiles from '../../helpers/get-json-files.js';
import getReleaseAppearanceTime from '../../helpers/get-release-appearance-time.js';
import type { EnhancedMusicRelease } from '../../types/index.js';

import environment from './environment.js';
import getEarliestReleaseAppearanceTime from './get-earliest-release-appearance-time.js';

export default async function* getTodayReleases(
  folder: string,
): AsyncGenerator<EnhancedMusicRelease> {
  const artistFiles = await getJsonFiles(folder);
  const today = new Date().toDateString();
  for (const artistFileName of artistFiles) {
    const data = await readFile(artistFileName);
    const releases = parse(
      array(releaseRecordSchema),
      JSON.parse(data.toString()),
    );
    const earliestReleaseAppearanceTime =
      getEarliestReleaseAppearanceTime(releases);
    for (const release of releases) {
      const releaseAppearanceTime = getReleaseAppearanceTime(release);
      if (
        releaseAppearanceTime &&
        releaseAppearanceTime.getTime() !==
          earliestReleaseAppearanceTime!.getTime() &&
        releaseAppearanceTime.toDateString() === today
      ) {
        yield release.tags
          ? release
          : await enhanceRelease(environment.LASTFM_API_KEY, release);
      }
    }
  }
}
