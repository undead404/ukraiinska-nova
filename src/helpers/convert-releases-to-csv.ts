import type { MusicRelease } from '../common/schemata.js';

import escapeCsvField from './escape-csv-field.js';
import joinArtists from './join-artists.js';

export default function convertReleasesToCsv(releases: MusicRelease[]) {
  const headers = [
    'Artist',
    'Title',
    'Release Date',
    'Type',
    'Total Tracks',
    'URL',
  ];

  const csvRows = [headers.join(',')];

  for (const release of releases) {
    const row = [
      escapeCsvField(joinArtists(release.artists)),
      escapeCsvField(release.title),
      release.releaseDate,
      release.type,
      release.totalTracks?.toString() || '',
      release.url,
    ];
    csvRows.push(row.join(','));
  }
  return csvRows.join('\n');
}
