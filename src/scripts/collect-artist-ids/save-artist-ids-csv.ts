import { writeFile } from 'node:fs/promises';

import escapeCsvField from '../../helpers/escape-csv-field';

import type { Artist } from './types.js';

export default function saveArtistIdsCsv(artists: Artist[]): Promise<void> {
  return writeFile(
    './artist-ids.csv',
    'Artist,SpotifyID,YoutubeMusicID\n' +
      artists
        .map(
          ({ name, spotifyId, youtubeMusicId }) =>
            `${escapeCsvField(name)},${spotifyId},${youtubeMusicId}`,
        )
        .join('\n'),
  );
}
