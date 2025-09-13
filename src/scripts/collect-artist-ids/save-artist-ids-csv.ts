import { writeFile } from 'node:fs/promises';

import escapeCsvField from '../../helpers/escape-csv-field';

export default function saveArtistIdsCsv(
  artistsIds: Map<string, string>,
): Promise<void> {
  return writeFile(
    './artist-ids.csv',
    'Artist,SpotifyID\n' +
      [...artistsIds.entries()]
        .map(([name, id]) => `${escapeCsvField(name)},${id}`)
        .join('\n'),
  );
}
