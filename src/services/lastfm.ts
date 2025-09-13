import {
  array,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  number,
  object,
  pipe,
  string,
} from 'valibot';

import fetchWithSchema from '../helpers/fetch-with-schema.js';

const MAX_TAGS_NUMBER = 8;

const IGNORED_TAGS = ['Ukrainian', 'Ukraine', 'cringecore', 'Jerk', 'Russia'];

const errorResponseSchema = object({
  error: number(),
  message: pipe(string(), nonEmpty()),
});

const toptagsResponseSchema = object({
  toptags: object({
    tag: array(
      object({
        count: pipe(number(), minValue(1), maxValue(100)),
        name: pipe(string(), minLength(1)),
      }),
    ),
  }),
});

export async function getReleaseTags(
  apiKey: string,
  release: {
    title: string;
    artists: string[];
  },
) {
  const tags = [];
  for (const artist of release.artists) {
    console.log(artist);
    try {
      const artistDetails = await fetchWithSchema(
        `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json`,
        toptagsResponseSchema,
        errorResponseSchema,
      );
      tags.push(...artistDetails.toptags.tag);
    } catch (error) {
      console.error(error);
    }
  }
  // sort tags by count, descending
  tags.sort((a, b) => b.count - a.count);
  // remove duplicates
  const uniqueTags = tags.reduce(
    (acc, tag) => {
      if (!acc.find((t) => t.name === tag.name)) {
        acc.push(tag);
      }
      return acc;
    },
    [] as { name: string; count: number }[],
  );
  // take only MAX_TAGS_NUMBER tags
  const limitedTags = uniqueTags
    .filter((tag) => !IGNORED_TAGS.includes(tag.name))
    .slice(0, MAX_TAGS_NUMBER);
  // return only tag names
  return limitedTags.filter((tag) => tag.count >= 50).map((tag) => tag.name);
}
