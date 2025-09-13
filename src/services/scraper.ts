import * as fs from 'node:fs/promises';

import deduplicateReleases from '../helpers/deduplicate-releases.js';
import delay from '../helpers/delay.js';
import escapeCsvField from '../helpers/escape-csv-field.js';
import getCountByProperty from '../helpers/get-count-by-property.js';
import joinArtists from '../helpers/join-artists.js';
import type {
  MusicRelease,
  ScrapingOptions,
  ScrapingStats,
} from '../types/index.js';

import type { SpotifyService } from './spotify.js';

export class ReleaseScraper {
  private spotifyService: SpotifyService;

  constructor(spotifyService: SpotifyService) {
    this.spotifyService = spotifyService;
  }

  /**
   * Збирає релізи для списку артистів
   */
  async scrapeReleases(
    artists: { id: string; name: string }[],
    options: ScrapingOptions,
  ): Promise<{ releases: MusicRelease[]; stats: ScrapingStats }> {
    const startTime = Date.now();
    const allReleases: MusicRelease[] = [];
    const artistsStats: Record<string, number> = {};

    console.log('🎵 Початок збору релізів');
    console.log(`📅 Період: ${options.startDate} - ${options.endDate}`);
    console.log(
      `👥 Артисти: ${artists.map((artist) => artist.name).join(', ')}`,
    );
    console.log('-'.repeat(60));

    for (let index = 0; index < artists.length; index++) {
      const { id, name } = artists[index];
      console.log(
        `\n[${index + 1}/${artists.length}] 🎤 Обробка: ${name} ${id}`,
      );

      try {
        // Отримуємо релізи
        const releases = await this.spotifyService.getArtistReleases(
          id,
          name,
          options,
        );

        allReleases.push(...releases);
        artistsStats[name] = releases.length;

        console.log(`  📀 Знайдено релізів: ${releases.length}`);

        // Затримка між артистами
        await delay(500);
      } catch (error) {
        console.error(`  ❌ Помилка обробки ${name}:`, error);
        artistsStats[name] = 0;
        throw error;
      }
    }

    const deduplicatedReleases = deduplicateReleases(allReleases);

    // Сортуємо за датою релізу
    deduplicatedReleases.sort((a, b) => {
      const timeDifference =
        new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      if (timeDifference === 0) {
        // Якщо дати однакові, сортуємо за популярністю артиста (спадання)
        return (b.artistsPopularity || 0) - (a.artistsPopularity || 0);
      }
      return timeDifference;
    });

    // Генеруємо статистику
    const stats: ScrapingStats = {
      totalReleases: deduplicatedReleases.length,
      bySource: { Spotify: deduplicatedReleases.length },
      byType: getCountByProperty(deduplicatedReleases, 'type'),
      byArtist: artistsStats,
      processingTime: Date.now() - startTime,
    };

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Всього знайдено релізів: ${deduplicatedReleases.length}`);
    console.log(
      `⏱️  Час обробки: ${(stats.processingTime / 1000).toFixed(1)}с`,
    );

    return { releases: deduplicatedReleases, stats };
  }

  /**
   * Зберігає релізи у JSON файл
   */
  async saveToFile(
    releases: MusicRelease[],
    filename = 'spotify_releases.json',
  ): Promise<void> {
    try {
      const jsonData = JSON.stringify(releases, undefined, 2);
      await fs.writeFile(filename, jsonData, 'utf8');
      console.log(`💾 Релізи збережено у файл: ${filename}`);
    } catch (error) {
      console.error('Помилка збереження файлу:', error);
      throw error;
    }
  }

  /**
   * Зберігає релізи у CSV файл
   */
  async saveToCsv(
    releases: MusicRelease[],
    filename = 'spotify_releases.csv',
  ): Promise<void> {
    try {
      const headers = [
        'Artist',
        'Title',
        'Release Date',
        'Type',
        'Total Tracks',
        'Popularity',
        'Genres',
        'URL',
      ];

      const csvRows = [headers.join(',')];

      for (const release of releases) {
        const row = [
          escapeCsvField(joinArtists(release.artists)),
          escapeCsvField(release.title),
          release.releaseDate,
          release.type,
          release.totalTracks.toString(),
          (release.popularity || 0).toString(),
          escapeCsvField(release.tags?.join('; ') || ''),
          release.url,
        ];
        csvRows.push(row.join(','));
      }

      await fs.writeFile(filename, csvRows.join('\n'), 'utf8');
      console.log(`📊 CSV файл збережено: ${filename}`);
    } catch (error) {
      console.error('Помилка збереження CSV:', error);
      throw error;
    }
  }

  /**
   * Виводить релізи у консоль
   */
  printReleases(releases: MusicRelease[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎵 ЗНАЙДЕНІ МУЗИЧНІ РЕЛІЗИ');
    console.log('='.repeat(80));

    for (const release of releases) {
      console.log(`📅 ${release.releaseDate}`);
      console.log(`🎵 ${joinArtists(release.artists)} - ${release.title}`);
      console.log(
        `📀 ${release.type.toUpperCase()}, ${release.totalTracks} треків`,
      );

      if (release.popularity !== undefined) {
        console.log(`⭐ Популярність: ${release.popularity}/100`);
      }

      if (release.tags?.length) {
        console.log(`🏷️  Теги: ${release.tags.join(', ')}`);
      }

      console.log(`🔗 ${release.url}`);
      console.log('-'.repeat(50));
    }
  }

  /**
   * Виводить статистику
   */
  printStats(stats: ScrapingStats): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 СТАТИСТИКА');
    console.log('='.repeat(60));

    console.log(`🎯 Всього релізів: ${stats.totalReleases}`);
    console.log(
      `⏱️  Час обробки: ${(stats.processingTime / 1000).toFixed(1)} секунд`,
    );

    console.log('\nПо типах:');
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(
        `📀 ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`,
      );
    }

    console.log('\nПо артистах:');
    let sortedArtists = Object.entries(stats.byArtist);
    sortedArtists.sort(([, a], [, b]) => b - a);
    sortedArtists = sortedArtists.filter(([, count]) => count > 0).slice(0, 10);

    for (const [artist, count] of sortedArtists) {
      console.log(`🎤 ${artist}: ${count} релізів`);
    }
  }
}
