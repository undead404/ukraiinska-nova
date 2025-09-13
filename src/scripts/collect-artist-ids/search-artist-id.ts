import { SpotifyService } from '../../services/spotify.js';

import environment from './environment.js';

const spotifyService = new SpotifyService({
  clientId: environment.SPOTIFY_CLIENT_ID,
  clientSecret: environment.SPOTIFY_CLIENT_SECRET,
});

export default async function searchArtistId(artistName: string) {
  const artist = await spotifyService.searchArtist(artistName);
  if (!artist) {
    console.log(`Not found: ${artistName}`);
    return '';
  }
  return artist.id;
}
