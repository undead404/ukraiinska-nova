import type { MusicRelease } from '../common/schemata.js';

export default function mapSpotifyAlbumDetailsToMusicRelease(
  albumDetails: SpotifyApi.AlbumObjectFull,
): MusicRelease {
  return {
    artists: albumDetails.artists.map((a) => a.name),
    artistsPopularity: Number.NaN,
    title: albumDetails.name,
    releaseDate: albumDetails.release_date,
    type: albumDetails.album_type as 'album' | 'single' | 'compilation',
    totalTracks: albumDetails.total_tracks,
    url: albumDetails.external_urls.spotify,
    imageUrl: albumDetails.images?.[0]?.url,
    // genres: albumDetails.genres || [],
    // popularity: albumDetails.popularity,
    // markets: album.available_markets || [],
  };
}
