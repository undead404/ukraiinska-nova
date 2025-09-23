import normalizeTags from '../../helpers/normalize-tags.js';

import fetchFromLastfm from './fetch-from-lastfm.js';
import { toptagsResponseSchema } from './schemata.js';

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
      const artistTopTags = await fetchFromLastfm(
        {
          api_key: apiKey,
          artist: trimmedArtistName,
          method: 'artist.gettoptags',
        },
        toptagsResponseSchema,
      );
      if (artistTopTags) {
        artistTags = normalizeTags(artistTopTags.toptags.tag);
        ARTIST_TAGS_CACHE.set(trimmedArtistName, artistTags);
      }
    }
    if (artistTags) {
      tags.push(...artistTags);
    }
  }
  // sort tags by count, descending
  tags.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
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
