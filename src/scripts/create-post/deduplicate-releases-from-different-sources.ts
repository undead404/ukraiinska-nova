import type { EnhancedMusicRelease } from '../../types';

function calculateReleaseLimitedIdentity(
  release: EnhancedMusicRelease,
): string {
  return `${release.artists.join(',').toLowerCase()} - ${release.title.toLowerCase()}`;
}

export default function deduplicateReleasesFromDifferentSources(
  ...releasesFromMultipleSources: EnhancedMusicRelease[][]
): EnhancedMusicRelease[] {
  const knownIdentities = new Set<string>();
  const mergedReleases: EnhancedMusicRelease[] = [];
  for (const releasesFromSingleSource of releasesFromMultipleSources) {
    for (const release of releasesFromSingleSource) {
      const releaseIdentity = calculateReleaseLimitedIdentity(release);
      if (!knownIdentities.has(releaseIdentity)) {
        mergedReleases.push(release);
        knownIdentities.add(releaseIdentity);
      }
    }
  }
  return mergedReleases;
}
