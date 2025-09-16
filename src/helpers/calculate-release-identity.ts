import type { MusicRelease } from '../common/schemata';

export default function calculateReleaseIdentity(
  release: MusicRelease,
): string {
  return `${release.artists.join(',').toLowerCase()}|${release.title.toLowerCase()}|${release.type}|${release.releaseDate}`;
}
