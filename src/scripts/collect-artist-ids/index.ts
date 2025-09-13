import readFileArtists from './read-artists';
import saveArtistIdsCsv from './save-artist-ids-csv';
import searchArtistId from './search-artist-id';

const artistNames = await readFileArtists('./artists.txt');

const artistsIds = new Map<string, string>();

for (const name of artistNames) {
  try {
    artistsIds.set(name, await searchArtistId(name));
  } catch (error) {
    console.error(`Error searching for ${name}:`, error);
    artistsIds.set(name, '');
  }
}
await saveArtistIdsCsv(artistsIds);
