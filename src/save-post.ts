import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import Mustache from 'mustache';

import joinArtists from './helpers/join-artists.js';
import translateAlbumType from './helpers/translate-album-type.js';
import type { MusicRelease } from './types';

const postTemplate = (
  await readFile('./src/post-template.md.mustache')
).toString();

Mustache.parse(postTemplate);

const POST_FOLDER = ['docs', '_posts'];

function getTags(releases: MusicRelease[]) {
  const countTags = new Map<string, number>();
  for (const release of releases) {
    for (const tag of release.tags || []) {
      countTags.set(tag, (countTags.get(tag) || 0) + 1);
    }
  }

  const tagPairs = Array.from(countTags.entries());

  tagPairs.sort(([, a], [, b]) => b - a);

  return tagPairs.map(([tag]) => tag);
}

export default async function savePost(date: string, releases: MusicRelease[]) {
  const prettyDate = new Date(date).toLocaleDateString('uk-UA');
  const targetFilename = join(...POST_FOLDER, `${date}-releases.md`);
  const post = Mustache.render(postTemplate, {
    prettyDate: prettyDate,
    rawDate: date,
    releases: releases.map((release) => ({
      ...release,
      artists: joinArtists(release.artists),
      tags: release.tags,
      type: translateAlbumType(release.type),
    })),
    tags: getTags(releases),
  });
  await writeFile(targetFilename, post);
}
