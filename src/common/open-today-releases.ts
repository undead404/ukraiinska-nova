import { readFile } from 'node:fs/promises';

import { array, parse } from 'valibot';

import type { MusicRelease } from './schemata';
import { releaseSchema } from './schemata';

export default async function openTodayReleases(): Promise<{
  date: string;
  releases: MusicRelease[];
}> {
  const data = await readFile('spotify_releases.json');

  const parsedData = parse(array(releaseSchema), JSON.parse(data.toString()));
  const dates = [...new Set(parsedData.map((release) => release.releaseDate))];

  if (dates.length > 1) {
    throw new Error(`Many dates: ${dates}`);
  }

  const date = dates[0];

  return { date, releases: parsedData };
}
