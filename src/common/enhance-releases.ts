import { getReleaseTags } from '../services/lastfm.js';
import type { EnhancedMusicRelease } from '../types/index.js';

import type { MusicRelease } from './schemata.js';

export default function enhanceReleases(
  lastfmApiKey: string,
  releases: MusicRelease[],
): Promise<EnhancedMusicRelease[]> {
  return Promise.all(
    releases.map(async (release) => ({
      ...release,
      tags: await getReleaseTags(lastfmApiKey, release),
    })),
  );
}
