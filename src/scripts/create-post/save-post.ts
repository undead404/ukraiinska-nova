import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import Mustache from 'mustache';

import type { MusicRelease } from '../../common/schemata.js';
import joinArtists from '../../helpers/join-artists.js';
import translateAlbumType from '../../helpers/translate-album-type.js';
import translatePopularity from '../../helpers/translate-popularity.js';
import type { EnhancedMusicRelease } from '../../types/index.js';

const postTemplate = await readFile('./src/post-template.md.mustache');

const postTemplateCode = postTemplate.toString();

Mustache.parse(postTemplateCode);

const POST_FOLDER = ['docs', '_posts'];

function getTags(releases: EnhancedMusicRelease[]) {
  const countTags = new Map<string, number>();
  for (const release of releases) {
    for (const tag of release.tags || []) {
      countTags.set(tag, (countTags.get(tag) || 0) + 1);
    }
  }

  const tagPairs = [...countTags.entries()];

  tagPairs.sort(([, a], [, b]) => b - a);

  return tagPairs.map(([tag]) => tag);
}

const MAX_SHORT_ARTISTS_LIST_LENGTH = 5;

function getShortArtistsList(releases: MusicRelease[]) {
  const artists = new Set<string>();
  for (const release of releases) {
    for (const artist of release.artists) {
      artists.add(artist);
      if (artists.size >= MAX_SHORT_ARTISTS_LIST_LENGTH) {
        return joinArtists([...artists]);
      }
    }
  }
  return [...artists].join(', ') + ' та інші';
}

export default async function savePost(
  date: string,
  releases: EnhancedMusicRelease[],
) {
  const prettyDate = new Date(date).toLocaleDateString('uk-UA');
  const targetFilename = path.join(...POST_FOLDER, `${date}-releases.md`);

  const post = Mustache.render(postTemplateCode, {
    imageUrl: releases.find((release) => release.imageUrl)?.imageUrl,
    prettyDate: prettyDate,
    rawDate: date,
    releases: releases.map((release) => ({
      ...release,
      artists: joinArtists(release.artists),
      popularity: translatePopularity(release.artistsPopularity),
      tags: release.tags,
      type: translateAlbumType(release.type),
    })),
    shortArtistsList: getShortArtistsList(releases),
    tags: getTags(releases),
  });
  await writeFile(targetFilename, post);
}
