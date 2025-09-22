import type { EnhancedMusicRelease } from '../types/index.js';

import enhanceRelease from './enhance-release.js';
import type { MusicRelease } from './schemata.js';

export default async function enhanceReleases(
  lastfmApiKey: string,
  releases: MusicRelease[],
): Promise<EnhancedMusicRelease[]> {
  const results: EnhancedMusicRelease[] = Array.from({
    length: releases.length,
  });
  for (const [index, release] of releases.entries()) {
    results[index] = await enhanceRelease(lastfmApiKey, release);
  }
  return results;
}
