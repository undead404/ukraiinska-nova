import SpotifyWebApi from 'spotify-web-api-node';

import delay from '../helpers/delay.js';
import filterAlbums from '../helpers/filter-albums.js';
import type {
  ArtistSearchResult,
  MusicRelease,
  ScrapingOptions,
  SpotifyConfig,
} from '../types/index.js';

import { readFromFileCache, writeToFileCache } from './file-cache.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

export class SpotifyService {
  private spotifyApi: SpotifyWebApi;
  private accessToken: string | undefined = undefined;
  private tokenExpirationTime: number = 0;

  constructor(config: SpotifyConfig) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  /**
   * Отримує access token для Spotify API
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpirationTime) {
      return this.accessToken;
    }

    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.accessToken = data.body.access_token;
      this.tokenExpirationTime = now + data.body.expires_in * 1000 - 60_000; // -1 хвилина для безпеки

      this.spotifyApi.setAccessToken(this.accessToken);

      console.log('✅ Spotify access token отримано');
      return this.accessToken;
    } catch (error) {
      throw new Error(`Помилка автентифікації Spotify: ${error}`);
    }
  }

  /**
   * Шукає артиста за ім'ям
   */
  async searchArtist(
    artistName: string,
  ): Promise<ArtistSearchResult | undefined> {
    const getCachedValue = await readFromFileCache(
      `spotify-artist-${artistName}`,
    );
    if (getCachedValue) {
      return getCachedValue as ArtistSearchResult;
    }
    await this.getAccessToken();

    try {
      const searchResult = await this.spotifyApi.searchArtists(artistName, {
        limit: 10,
      });
      const artists = searchResult.body.artists?.items || [];

      // Шукаємо точний збіг або найближчий
      const exactMatch =
        artists.find((artist) => artist.name === artistName) ??
        artists.find(
          (artist) => artist.name.toLowerCase() === artistName.toLowerCase(),
        );

      if (exactMatch) {
        await writeToFileCache(
          `spotify-artist-${artistName}`,
          exactMatch,
          Date.now() + MONTH,
        );
        return {
          id: exactMatch.id,
          name: exactMatch.name,
          popularity: exactMatch.popularity,
          followers: exactMatch.followers.total,
        };
      }

      // Якщо точного збігу немає, повертаємо найпопулярнішого
      if (artists.length > 0) {
        let mostPopular: SpotifyApi.ArtistObjectFull | undefined = undefined;
        for (const artist of artists) {
          if (!mostPopular || artist.popularity > mostPopular.popularity) {
            mostPopular = artist;
          }
        }
        console.log(
          `Можливо, малося на увазі: ${mostPopular!.name} (популярність: ${mostPopular!.popularity})`,
        );
      }

      return undefined;
    } catch (error) {
      console.error(`Помилка пошуку артиста ${artistName}:`, error);
      throw error;
    }
  }

  private async getAlbumDetails(
    album: SpotifyApi.AlbumObjectSimplified,
  ): Promise<MusicRelease> {
    let albumDetails: SpotifyApi.AlbumObjectFull | undefined = undefined;

    const cachedAlbumsDetails =
      await readFromFileCache<SpotifyApi.AlbumObjectFull>(
        `spotify-album-details-${album.id}`,
      );

    if (cachedAlbumsDetails) {
      albumDetails = cachedAlbumsDetails;
    } else {
      const albumResponse = await this.spotifyApi.getAlbum(album.id);
      albumDetails = albumResponse.body;
      await writeToFileCache(
        `spotify-album-details-${album.id}`,
        albumDetails,
        Date.now() + DAY,
      );
    }

    let artistsPopularity = 0;

    for (const artist of albumDetails.artists) {
      const popularity = await this.getArtistPopularity(artist.id);
      artistsPopularity = Math.max(artistsPopularity, popularity);
    }

    return {
      artists: albumDetails.artists.map((a) => a.name),
      artistsPopularity,
      title: album.name,
      releaseDate: albumDetails.release_date,
      type: album.album_type as 'album' | 'single' | 'compilation',
      totalTracks: albumDetails.total_tracks,
      url: album.external_urls.spotify,
      imageUrl: album.images?.[0]?.url,
      // genres: albumDetails.genres || [],
      popularity: albumDetails.popularity,
      // markets: album.available_markets || [],
    };
  }

  /**
   * Отримує релізи артиста у вказаному періоді
   */
  async getArtistReleases(
    artistId: string,
    artistName: string,
    options: ScrapingOptions,
  ): Promise<MusicRelease[]> {
    await this.getAccessToken();

    const releases: MusicRelease[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    try {
      while (hasMore) {
        let items: SpotifyApi.AlbumObjectSimplified[] = [];

        const cachedArtistAlbums = await readFromFileCache<
          SpotifyApi.AlbumObjectSimplified[]
        >(`spotify-artist-releases-${artistId}`);
        if (cachedArtistAlbums) {
          items = cachedArtistAlbums;
        } else {
          const response = await this.spotifyApi.getArtistAlbums(artistId, {
            country: options.country || 'UA',
            limit,
            offset,
          });
          items = response.body.items;

          await writeToFileCache(
            `spotify-artist-releases-${artistId}`,
            items,
            Date.now() + HOUR,
          );
        }

        if (items.length === 0) {
          // eslint-disable-next-line sonarjs/no-dead-store
          hasMore = false;
          break;
        }
        items = filterAlbums(items, options);

        for (const album of items) {
          const release = await this.getAlbumDetails(album);
          releases.push(release);

          // Невелика затримка для уникнення rate limiting
          await delay(200);
        }

        offset += limit;

        // Якщо отримали менше, ніж limit, значить більше немає
        if (items.length < limit) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`Помилка отримання релізів для ${artistName}:`, error);
      throw error;
    }

    return releases;
  }

  async getArtist(artistId: string): Promise<SpotifyApi.ArtistObjectFull> {
    await this.getAccessToken();

    try {
      const artist = await this.spotifyApi.getArtist(artistId);
      return artist.body;
    } catch (error) {
      console.error('Помилка отримання інформації про артиста:', error);
      throw error;
    }
  }

  async getArtistPopularity(artistId: string): Promise<number> {
    const cachedPopularity = await readFromFileCache<number>(
      `spotify-artist-popularity-${artistId}`,
    );
    if (cachedPopularity !== undefined) {
      return cachedPopularity;
    }

    const artist = await this.getArtist(artistId);
    const popularity = artist.popularity;
    await writeToFileCache(
      `spotify-artist-popularity-${artistId}`,
      popularity,
      Date.now() + MONTH,
    );
    return popularity;
  }
}
