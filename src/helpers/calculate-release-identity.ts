import type { MusicRelease } from '../common/schemata.js';

const RELEASE_IDENTITY_CACHE = new WeakMap<MusicRelease, string>();

export default function calculateReleaseIdentity(
  release: MusicRelease,
): string {
  const cachedValue = RELEASE_IDENTITY_CACHE.get(release);
  if (cachedValue) {
    return cachedValue;
  }
  const value = `${release.artists.join(',').toLowerCase()}|${release.title.toLowerCase()}|${release.type}|${release.releaseDate}`;
  RELEASE_IDENTITY_CACHE.set(release, value);
  return value;
}
