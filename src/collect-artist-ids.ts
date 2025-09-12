import { writeFile } from 'fs/promises';
import environment from './environment';
import escapeCsvField from './helpers/escape-csv-field';
import readFileArtists from './read-artists';
import { SpotifyService } from './services/spotify';

const artistNames = await readFileArtists('./artists.txt');

const spotifyService = new SpotifyService({
  clientId: environment.SPOTIFY_CLIENT_ID,
  clientSecret: environment.SPOTIFY_CLIENT_SECRET,
});

const artistIds = new Map<string, string>();

for (const name of artistNames) {
  try {
    const artist = await spotifyService.searchArtist(name);
    if (artist) {
      artistIds.set(name, artist.id);
      console.log(`Found: ${name} -> ${artist.id}`);
    } else {
      artistIds.set(name, '');
      console.log(`Not found: ${name}`);
    }
  } catch (error) {
    console.error(`Error searching for ${name}:`, error);
    artistIds.set(name, '');
  }
}

await writeFile(
  './artist-ids.csv',
  'Artist,SpotifyID\n' +
    Array.from(artistIds.entries())
      .map(([name, id]) => `${escapeCsvField(name)},${id}`)
      .join('\n'),
);
