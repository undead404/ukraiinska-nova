import SpotifyWebApi from 'spotify-web-api-node';

import type { MusicRelease } from '../common/schemata.js';
import chunkify from '../helpers/chunkify.js';
import delay from '../helpers/delay.js';
import filterAlbums from '../helpers/filter-albums.js';
import mapSpotifyAlbumDetailsToMusicRelease from '../helpers/map-spotify-album-details-to-music-release.js';
import type {
  ScrapingOptions,
  SpotifyArtistSearchResult,
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
      console.log('this.spotifyApi.clientCredentialsGrant()');
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
  ): Promise<SpotifyArtistSearchResult | undefined> {
    const getCachedValue = await readFromFileCache(
      `spotify-artist-${artistName}`,
    );
    if (getCachedValue) {
      return getCachedValue as SpotifyArtistSearchResult;
    }
    await this.getAccessToken();

    try {
      await delay(500);
      console.log(`this.spotifyApi.searchArtists("${artistName}", {
        limit: 10,
      })`);
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

  private async getAlbumsDetails(
    albums: SpotifyApi.AlbumObjectSimplified[],
  ): Promise<MusicRelease[]> {
    const albumsChunks = chunkify(albums, 20);
    const releases: MusicRelease[] = [];
    for (const albumsChunk of albumsChunks) {
      await delay(500);
      console.log(`this.spotifyApi.getAlbums(
        ${albumsChunk.map(({ id }) => `"${id}"`)},
      )`);
      const albumResponse = await this.spotifyApi.getAlbums(
        albumsChunk.map(({ id }) => id),
      );
      const albumsDetails = albumResponse.body.albums;

      const chunkReleases = albumsDetails.map((albumDetails) =>
        mapSpotifyAlbumDetailsToMusicRelease(albumDetails),
      );

      releases.push(...chunkReleases);
    }

    return releases;
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
        await delay(500);
        console.log(`this.spotifyApi.getArtistAlbums("${artistId}", {
          country: "${options.country || 'UA'}",
          limit: ${limit},
          offset: ${offset},
        })`);
        const response = await this.spotifyApi.getArtistAlbums(artistId, {
          country: options.country || 'UA',
          limit,
          offset,
        });
        items = response.body.items;

        if (items.length === 0) {
          // eslint-disable-next-line sonarjs/no-dead-store
          hasMore = false;
          break;
        }
        items = filterAlbums(items, options);

        releases.push(...(await this.getAlbumsDetails(items)));

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
}
