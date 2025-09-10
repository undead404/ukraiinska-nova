import type { MusicRelease } from '../types';

function calculateReleaseIdentity(release: MusicRelease): string {
  return `${release.artists.join(',').toLowerCase()}|${release.title.toLowerCase()}|${release.type}|${release.releaseDate}`;
}

export default function deduplicateReleases(
  releases: MusicRelease[],
): MusicRelease[] {
  const seen = new Set<string>();
  return releases.filter((release) => {
    const identity = calculateReleaseIdentity(release);
    if (seen.has(identity)) {
      return false;
    }
    seen.add(identity);
    return true;
  });
}
