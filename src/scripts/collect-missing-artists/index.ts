import path from 'node:path';

import { appendToFile } from '../../common/append-to-file';
import openSavedReleases from '../../common/open-saved-releases';
import readFileArtistIds from '../../common/read-artist-ids';
import { SPOTIFY_RELEASES_DATA_FOLDER } from '../../constants';

async function main() {
  const folder = path.join(...SPOTIFY_RELEASES_DATA_FOLDER);
  const artists = await readFileArtistIds('./artist-ids.csv');
  const knownArtists = new Set(artists.map((artist) => artist.name));
  const caughtArtists = new Set<string>();
  for (const artist of artists) {
    const releases = await openSavedReleases(
      folder,
      artist.spotifyId,
      artist.name,
    );
    for (const release of releases || []) {
      for (const releaseArtist of release.artists) {
        if (
          releaseArtist !== artist.name &&
          !knownArtists.has(releaseArtist) &&
          !caughtArtists.has(releaseArtist)
        ) {
          console.log(`Пропущений? ${releaseArtist}`);
          await appendToFile(
            `${artist.name} -> ${releaseArtist}`,
            'missed-artists.txt',
          );
          caughtArtists.add(releaseArtist);
        }
      }
    }
  }
}

await main();
