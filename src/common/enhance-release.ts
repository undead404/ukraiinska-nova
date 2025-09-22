import delay from '../helpers/delay.js';
import {
  getArtistsPopularity,
  getArtistsTags,
} from '../services/lastfm/index.js';
import type { EnhancedMusicRelease } from '../types/index.js';

import type { MusicRelease } from './schemata.js';

export default async function enhanceRelease(
  lastfmApiKey: string,
  release: MusicRelease,
): Promise<EnhancedMusicRelease> {
  await delay(100);
  const artistsPopularity = await getArtistsPopularity(
    lastfmApiKey,
    release.artists,
  );
  await delay(100);
  const tags = await getArtistsTags(lastfmApiKey, release.artists);
  return {
    ...release,
    artistsPopularity,
    tags,
  };
}
