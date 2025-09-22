import fetchFromLastfm from './fetch-from-lastfm.js';
import { infoResponseSchema } from './schemata.js';

const ARTIST_POPULARITY_CACHE = new Map<string, number>();

export async function getArtistsPopularity(apiKey: string, artists: string[]) {
  let maxPopularity = 0;
  for (const artist of artists) {
    const trimmedArtistName = artist.trim();
    if (!trimmedArtistName) {
      throw new Error('Empty artist name');
    }
    let popularity = 0;
    const cachedValue = ARTIST_POPULARITY_CACHE.get(trimmedArtistName);
    if (!cachedValue && cachedValue !== 0) {
      const artistInfo = await fetchFromLastfm(
        {
          api_key: apiKey,
          artist: encodeURIComponent(trimmedArtistName),
          method: 'artist.getinfo',
        },
        infoResponseSchema,
      );
      if (artistInfo) {
        popularity = Math.trunc(Math.log10(artistInfo.artist.stats.listeners));
        ARTIST_POPULARITY_CACHE.set(trimmedArtistName, popularity);
      }
    } else {
      popularity = cachedValue;
    }
    if (popularity > maxPopularity) {
      maxPopularity = popularity;
    }
  }
  return maxPopularity;
}
