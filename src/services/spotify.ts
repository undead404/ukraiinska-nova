import SpotifyWebApi from 'spotify-web-api-node';

import delay from '../helpers/delay.js';
import isDateInRange from '../helpers/is-date-in-range.js';
import type {
  SpotifyConfig,
  MusicRelease,
  ArtistSearchResult,
  ScrapingOptions,
} from '../types/index.js';
import normalizeDate from '../helpers/normalize-date.js';

import { readFromFileCache, writeToFileCache } from './file-cache.js';

const HOUR = 3600000;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

export class SpotifyService {
  private spotifyApi: SpotifyWebApi;
  private accessToken: string | null = null;
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
      this.tokenExpirationTime = now + data.body.expires_in * 1000 - 60000; // -1 хвилина для безпеки

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
  async searchArtist(artistName: string): Promise<ArtistSearchResult | null> {
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
        const mostPopular = artists.reduce((prev, current) =>
          prev.popularity > current.popularity ? prev : current,
        );
        //     return {
        //       id: mostPopular.id,
        //       name: mostPopular.name,
        //       popularity: mostPopular.popularity,
        //       followers: mostPopular.followers.total,
        //     };
        console.log(
          `Можливо, малося на увазі: ${mostPopular.name} (популярність: ${mostPopular.popularity})`,
        );
      }

      return null;
    } catch (error) {
      console.error(`Помилка пошуку артиста ${artistName}:`, error);
      throw error;
    }
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
        const albumTypes = ['album', 'single'];
        if (options.includeCompilations) {
          albumTypes.push('compilation');
        }
        if (options.includeAppears) {
          albumTypes.push('appears_on');
        }
        let items: SpotifyApi.AlbumObjectSimplified[] = [];

        // const cachedAlbums = await readFromFileCache<
        //   SpotifyApi.AlbumObjectSimplified[]
        // >(
        //   `spotify-artist-albums-${artistId}-${options.country || 'US'}-${limit}-${offset}`,
        // );

        // if (cachedAlbums) {
        // items = cachedAlbums;
        // } else {
        const response = await this.spotifyApi.getArtistAlbums(artistId, {
          country: options.country || 'US',
          limit,
          offset,
        });
        items = response.body.items;

        await writeToFileCache(
          `spotify-artist-albums-${artistId}-${options.country || 'US'}-${limit}-${offset}`,
          items,
          Date.now() + HOUR,
        );
        // }

        items = items.filter((album) => albumTypes.includes(album.album_type));

        if (items.length === 0) {
          hasMore = false;
          break;
        }

        for (const album of items) {
          const releaseDate = normalizeDate(album.release_date);

          if (isDateInRange(releaseDate, options.startDate, options.endDate)) {
            // Отримуємо детальну інформацію про альбом

            let albumDetails: SpotifyApi.AlbumObjectFull | null = null;

            const cachedAlbumsDetails =
              await readFromFileCache<SpotifyApi.AlbumObjectFull>(
                `spotify-album-details-${album.id}`,
              );

            if (cachedAlbumsDetails) {
              albumDetails = cachedAlbumsDetails;
            } else {
              albumDetails = (await this.spotifyApi.getAlbum(album.id)).body;
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

            const release: MusicRelease = {
              artists: albumDetails.artists.map((a) => a.name),
              artistsPopularity,
              title: album.name,
              releaseDate,
              type: album.album_type as 'album' | 'single' | 'compilation',
              totalTracks: albumDetails.total_tracks,
              url: album.external_urls.spotify,
              imageUrl: album.images?.[0]?.url,
              genres: albumDetails.genres || [],
              popularity: albumDetails.popularity,
              markets: album.available_markets || [],
            };

            releases.push(release);

            // Невелика затримка для уникнення rate limiting
            await delay(200);
          }
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

  /**
   * Отримує топ треки артиста (бонусна функція)
   */
  async getArtistTopTracks(artistId: string, country = 'US'): Promise<any[]> {
    await this.getAccessToken();

    try {
      const topTracks = await this.spotifyApi.getArtistTopTracks(
        artistId,
        country,
      );
      return topTracks.body.tracks;
    } catch (error) {
      console.error('Помилка отримання топ треків:', error);
      throw error;
    }
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
    if (cachedPopularity !== null) {
      return cachedPopularity;
    }

    const artist = await this.getArtist(artistId);
    const popularity = artist.popularity;
    await writeToFileCache(
      `spotify-artist-popularity-${artistId}`,
      popularity,
      Date.now() + DAY,
    );
    return popularity;
  }
}
