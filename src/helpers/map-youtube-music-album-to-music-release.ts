import type { AlbumDetailed } from 'ytmusic-api';

import type { MusicRelease } from '../common/schemata.js';

export default function mapYTMusicAlbumToMusicRelease(
  album: AlbumDetailed,
  artistName: string,
): MusicRelease {
  // Get the best quality thumbnail
  let bestThumbnail: (typeof album.thumbnails)[0] | undefined;
  for (const thumbnail of album.thumbnails || []) {
    if (
      !bestThumbnail ||
      thumbnail.width * thumbnail.height >
        bestThumbnail.width * bestThumbnail.height
    ) {
      bestThumbnail = thumbnail;
    }
  }

  return {
    title: album.name,
    artists: [album.artist.name || artistName],
    type: album.type?.toLowerCase() as 'album' | 'single' | 'compilation',
    totalTracks: Number.NaN,
    releaseDate: album.year ? `${album.year}` : '',
    imageUrl: bestThumbnail?.url,
    url: `https://music.youtube.com/playlist?list=${album.playlistId}`,
    artistsPopularity: Number.NaN,
  };
}
