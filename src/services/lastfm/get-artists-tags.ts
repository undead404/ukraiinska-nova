import fetchWithSchema from '../../helpers/fetch-with-schema.js';
import normalizeTags from '../../helpers/normalize-tags.js';

import { errorResponseSchema, toptagsResponseSchema } from './schemata.js';

const MAX_TAGS_NUMBER = 8;

const ARTIST_TAGS_CACHE = new Map<string, { count: number; name: string }[]>();

export async function getArtistsTags(apiKey: string, artists: string[]) {
  const tags = [];
  for (const artist of artists) {
    const trimmedArtistName = artist.trim();
    if (!trimmedArtistName) {
      throw new Error('Empty artist name');
    }
    let artistTags = ARTIST_TAGS_CACHE.get(trimmedArtistName);
    if (!artistTags) {
      try {
        const artistTopTags = await fetchWithSchema(
          `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(trimmedArtistName)}&api_key=${apiKey}&format=json`,
          toptagsResponseSchema,
          errorResponseSchema,
        );
        artistTags = normalizeTags(artistTopTags.toptags.tag);
        ARTIST_TAGS_CACHE.set(trimmedArtistName, artistTags);
      } catch (error) {
        console.error(error);
      }
    }
    tags.push(...artistTags!);
  }
  // sort tags by count, descending
  tags.sort((a, b) => b.count - a.count);
  // remove duplicates
  const uniqueTags: { name: string; count: number }[] = [];
  for (const tag of tags) {
    if (!uniqueTags.some((t) => t.name === tag.name)) {
      uniqueTags.push(tag);
    }
  }
  // take only MAX_TAGS_NUMBER tags
  const limitedTags = uniqueTags.slice(0, MAX_TAGS_NUMBER);
  // return only tag names
  return limitedTags.filter((tag) => tag.count >= 50).map((tag) => tag.name);
}
