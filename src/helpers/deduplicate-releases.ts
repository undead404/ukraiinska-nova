import type { MusicRelease } from '../common/schemata.js';

import calculateReleaseIdentity from './calculate-release-identity.js';

export default function deduplicateReleases(
  releases: MusicRelease[],
): MusicRelease[] {
  const seenReleases = new Map<string, MusicRelease>();
  for (const release of releases) {
    const identity = calculateReleaseIdentity(release);
    const previousRelease = seenReleases.get(identity);
    if (
      !previousRelease ||
      // Якщо вже бачили цей реліз, порівнюємо популярність артиста
      previousRelease.artistsPopularity < release.artistsPopularity
    ) {
      seenReleases.set(identity, release);
    }
  }
  return [...seenReleases.values()];
}
