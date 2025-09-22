import { YouTubeMusicService } from '../../services/youtube-music.js';

const ytmService = new YouTubeMusicService();

export default async function searchYoutubeMusicId(artistName: string) {
  const artist = await ytmService.searchArtist(artistName);
  if (!artist) {
    console.log(`Not found: ${artistName}`);
    return '';
  }
  return artist.artistId;
}
