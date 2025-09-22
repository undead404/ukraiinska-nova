import type { AlbumDetailed, ArtistDetailed } from 'ytmusic-api';
import YTMusic from 'ytmusic-api';

import { appendToFile } from '../common/append-to-file.js';
import type { MusicRelease } from '../common/schemata.js';
import delay from '../helpers/delay.js';
import mapYTMusicAlbumToMusicRelease from '../helpers/map-youtube-music-album-to-music-release.js';

import { readFromFileCache, writeToFileCache } from './file-cache.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

export class YouTubeMusicService {
  private ytMusic: YTMusic;
  private isInitialized = false;

  constructor() {
    // YouTube Music doesn't require authentication for basic searches
    // but you can optionally provide cookies for authenticated requests
    this.ytMusic = new YTMusic();
  }

  /**
   * Ініціалізує YouTube Music API
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Ініціалізація YouTube Music API...');
      await this.ytMusic.initialize();
      this.isInitialized = true;
      console.log('✅ YouTube Music API ініціалізовано');
    } catch (error) {
      throw new Error(`Помилка ініціалізації YouTube Music: ${error}`);
    }
  }

  /**
   * Шукає артиста за ім'ям
   */
  async searchArtist(artistName: string): Promise<ArtistDetailed | undefined> {
    const getCachedValue = await readFromFileCache(
      `ytmusic-artist-${artistName}`,
    );
    if (getCachedValue) {
      return getCachedValue as ArtistDetailed;
    }

    await this.initialize();

    try {
      await delay(1000); // YouTube Music має більш суворі обмеження
      console.log(`ytMusic.searchArtists("${artistName}")`);

      const searchResult: ArtistDetailed[] =
        await this.ytMusic.searchArtists(artistName);
      const artists = searchResult || [];

      // Шукаємо точний збіг або найближчий
      const exactMatch =
        artists.find((artist) => artist.name === artistName) ??
        artists.find(
          (artist) => artist.name.toLowerCase() === artistName.toLowerCase(),
        );

      if (exactMatch) {
        await writeToFileCache(
          `ytmusic-artist-${artistName}`,
          exactMatch,
          Date.now() + MONTH,
        );
        return exactMatch;
      }

      // Якщо точного збігу немає, повертаємо найпопулярнішого

      throw new Error('Артист не знайдений');
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
  ): Promise<MusicRelease[]> {
    await this.initialize();

    try {
      await delay(1000);
      console.log(`ytMusic.getArtistAlbums("${artistId}")`);

      let albumsResponse = (await readFromFileCache(
        `ytm-artist-${artistName}-${artistId}`,
      )) as AlbumDetailed[];
      if (!albumsResponse) {
        albumsResponse = await this.ytMusic.getArtistAlbums(artistId);
        await writeToFileCache(
          `ytm-artist-${artistName}-${artistId}`,
          albumsResponse,
          Date.now() + DAY,
        );
      }

      const albums = albumsResponse.filter((album) => album.year) || [];

      console.log(`Знайдено ${albums.length} релізів для ${artistName}`);
      if (albums.length === 0) {
        await appendToFile(artistName, 'ytm-check.txt');
      }

      const releases = albums.map((album) =>
        mapYTMusicAlbumToMusicRelease(album, artistName),
      );

      return releases;
    } catch (error) {
      console.error(`Помилка отримання релізів для ${artistName}:`, error);
      throw error;
    }
  }
}
