import readFileArtists from './read-artists';
import saveArtistIdsCsv from './save-artist-ids-csv';
import searchSpotifyId from './search-spotify-id';
import searchYoutubeMusicId from './search-youtube-music-id';
import type { Artist } from './types.js';

const artistNames = await readFileArtists('./artists.txt');

const artists: Artist[] = [];

for (const name of artistNames) {
  const artist = {
    name,
    spotifyId: '',
    youtubeMusicId: '',
  };
  try {
    artist.spotifyId = await searchSpotifyId(name);
  } catch (error) {
    console.error(`Error searching for ${name} in Spotify:`, error);
  }
  try {
    artist.youtubeMusicId = await searchYoutubeMusicId(name);
  } catch (error) {
    console.error(`Error searching for ${name} in Youtube Music:`, error);
  }
  artists.push(artist);
}
await saveArtistIdsCsv(artists);
