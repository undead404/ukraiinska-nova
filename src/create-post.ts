import { readFile } from 'fs/promises';

import {
  array,
  custom,
  minLength,
  minValue,
  number,
  object,
  parse,
  picklist,
  pipe,
  string,
  url,
} from 'valibot';

import savePost from './save-post.js';
import type { MusicRelease } from './types/index.js';
// import { getReleaseTags } from './services/lastfm';

const postSchema = object({
  artists: pipe(array(string()), minLength(1)),
  artistsPopularity: pipe(number(), minValue(0)),
  imageUrl: pipe(string(), url()),
  releaseDate: pipe(
    string(),
    minLength(10),
    custom(
      (input) => !Number.isNaN(new Date(`${input}`).getTime()),
      'This string is not an ISO date',
    ),
  ),
  // tags: array(pipe(string(), minLength(1))),
  title: pipe(string(), minLength(1)),
  totalTracks: pipe(number(), minValue(1)),
  type: picklist(['album', 'compilation', 'single']),
  url: pipe(string(), url()),
});

const data = await readFile('spotify_releases.json');

const parsedData = parse(array(postSchema), JSON.parse(data.toString()));
const dates = Array.from(
  new Set(parsedData.map((release) => release.releaseDate)),
);

if (dates.length > 1) {
  throw new Error(`Many dates: ${dates}`);
}

const date = dates[0];

const releasesWithTags: MusicRelease[] = parsedData;

// for (const release of releasesWithTags) {
// release.tags = await getReleaseTags(release);
// }

await savePost(date, releasesWithTags);
