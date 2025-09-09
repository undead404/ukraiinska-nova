import SpotifyWebApi from 'spotify-web-api-node';
import type {
  SpotifyConfig,
  MusicRelease,
  ArtistSearchResult,
  ScrapingOptions,
} from '../types/index.js';
import joinArtists from '../helpers/join-artists.js';

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
      return null;
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

        const albums = await this.spotifyApi.getArtistAlbums(artistId, {
          country: options.country || 'US',
          limit,
          offset,
        });

        const items = albums.body.items.filter((album) =>
          albumTypes.includes(album.album_type),
        );

        if (items.length === 0) {
          hasMore = false;
          break;
        }

        for (const album of items) {
          const releaseDate = this.normalizeDate(album.release_date);

          if (
            this.isDateInRange(releaseDate, options.startDate, options.endDate)
          ) {
            // Отримуємо детальну інформацію про альбом
            const albumDetails = await this.spotifyApi.getAlbum(album.id);

            const release: MusicRelease = {
              artist: joinArtists(albumDetails.body.artists.map((a) => a.name)),
              title: album.name,
              releaseDate,
              type: album.album_type as 'album' | 'single' | 'compilation',
              totalTracks: albumDetails.body.total_tracks,
              url: album.external_urls.spotify,
              imageUrl: album.images?.[0]?.url,
              genres: albumDetails.body.genres || [],
              popularity: albumDetails.body.popularity,
              markets: album.available_markets || [],
            };

            releases.push(release);

            // Невелика затримка для уникнення rate limiting
            await this.delay(100);
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
    }

    return releases;
  }

  /**
   * Нормалізує дату до формату YYYY-MM-DD
   */
  private normalizeDate(date: string): string {
    if (date.length === 4) {
      return `${date}-01-01`;
    } else if (date.length === 7) {
      return `${date}-01`;
    }
    return date;
  }

  /**
   * Перевіряє, чи знаходиться дата у вказаному діапазоні
   */
  private isDateInRange(
    date: string,
    startDate: string,
    endDate: string,
  ): boolean {
    return date >= startDate && date <= endDate;
  }

  /**
   * Затримка виконання
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      return [];
    }
  }
}
