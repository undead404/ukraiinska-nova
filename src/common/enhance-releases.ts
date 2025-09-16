import { getReleaseTags } from '../services/lastfm.js';
import type { EnhancedMusicRelease } from '../types/index.js';

import type { MusicRelease } from './schemata.js';

export default async function* enhanceReleases(
  lastfmApiKey: string,
  releases: MusicRelease[],
): AsyncGenerator<EnhancedMusicRelease, void, unknown> {
  for (const release of releases) {
    yield {
      ...release,
      tags: await getReleaseTags(lastfmApiKey, release),
    };
  }
}
