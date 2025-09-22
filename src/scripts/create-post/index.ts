import path from 'node:path';

import {
  SPOTIFY_RELEASES_DATA_FOLDER,
  YOUTUBE_MUSIC_RELEASES_DATA_FOLDER,
} from '../../constants.js';
import convertAsyncGeneratorToArray from '../../helpers/convert-async-generator-to-array.js';

import deduplicateReleasesFromDifferentSources from './deduplicate-releases-from-different-sources.js';
import getTodayReleases from './get-today-releases.js';
import savePost from './save-post.js';

const spotifyFolder = path.join(...SPOTIFY_RELEASES_DATA_FOLDER);

const spotifyReleases = await convertAsyncGeneratorToArray(
  getTodayReleases(spotifyFolder),
);
const ytmFolder = path.join(...YOUTUBE_MUSIC_RELEASES_DATA_FOLDER);
const ytmReleases = await convertAsyncGeneratorToArray(
  getTodayReleases(ytmFolder),
);

const releases = deduplicateReleasesFromDifferentSources(
  spotifyReleases,
  ytmReleases,
);

const today = new Date().toISOString().slice(0, 10);

await savePost(today, releases);
