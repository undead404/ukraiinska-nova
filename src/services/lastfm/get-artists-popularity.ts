import fetchWithSchema from '../../helpers/fetch-with-schema.js';

import { errorResponseSchema, infoResponseSchema } from './schemata.js';

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
      try {
        const artistInfo = await fetchWithSchema(
          `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(trimmedArtistName)}&api_key=${apiKey}&format=json`,
          infoResponseSchema,
          errorResponseSchema,
        );
        popularity = Math.trunc(Math.log10(artistInfo.artist.stats.listeners));
        ARTIST_POPULARITY_CACHE.set(trimmedArtistName, popularity);
      } catch (error) {
        console.error(error);
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
