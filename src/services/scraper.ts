import { SpotifyService } from "./spotify.js";
import type {
  MusicRelease,
  ScrapingOptions,
  ScrapingStats,
} from "../types/index.js";
import * as fs from "fs/promises";

export class ReleaseScraper {
  private spotifyService: SpotifyService;

  constructor(spotifyService: SpotifyService) {
    this.spotifyService = spotifyService;
  }

  /**
   * Збирає релізи для списку артистів
   */
  async scrapeReleases(
    artists: string[],
    options: ScrapingOptions
  ): Promise<{ releases: MusicRelease[]; stats: ScrapingStats }> {
    const startTime = Date.now();
    const allReleases: MusicRelease[] = [];
    const artistsStats: Record<string, number> = {};

    console.log("🎵 Початок збору релізів");
    console.log(`📅 Період: ${options.startDate} - ${options.endDate}`);
    console.log(`👥 Артисти: ${artists.join(", ")}`);
    console.log("-".repeat(60));

    for (let i = 0; i < artists.length; i++) {
      const artistName = artists[i];
      console.log(`\n[${i + 1}/${artists.length}] 🎤 Обробка: ${artistName}`);

      try {
        // Знаходимо артиста
        const artist = await this.spotifyService.searchArtist(artistName);

        if (!artist) {
          throw new Error(`  ❌ Артист не знайдений: ${artistName}`);
        }

        console.log(
          `  ✅ Знайдено: ${artist.name} (популярність: ${artist.popularity})`
        );

        // Отримуємо релізи
        const releases = await this.spotifyService.getArtistReleases(
          artist.id,
          artist.name,
          options
        );

        allReleases.push(...releases);
        artistsStats[artist.name] = releases.length;

        console.log(`  📀 Знайдено релізів: ${releases.length}`);

        // Затримка між артистами
        await this.delay(500);
      } catch (error) {
        console.error(`  ❌ Помилка обробки ${artistName}:`, error);
        artistsStats[artistName] = 0;
      }
    }

    // Сортуємо за датою релізу
    const sortedReleases = allReleases.sort((a, b) => {
      const timeDifference =
        new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      if (timeDifference === 0) {
        return (
          a.title.localeCompare(b.title, "uk") ||
          a.artist.localeCompare(b.artist, "uk")
        );
      }
      return timeDifference;
    });

    // Генеруємо статистику
    const stats: ScrapingStats = {
      totalReleases: sortedReleases.length,
      bySource: { Spotify: sortedReleases.length },
      byType: this.getCountByProperty(sortedReleases, "type"),
      byArtist: artistsStats,
      processingTime: Date.now() - startTime,
    };

    console.log("\n" + "=".repeat(60));
    console.log(`🎯 Всього знайдено релізів: ${sortedReleases.length}`);
    console.log(
      `⏱️  Час обробки: ${(stats.processingTime / 1000).toFixed(1)}с`
    );

    return { releases: sortedReleases, stats };
  }

  /**
   * Зберігає релізи у JSON файл
   */
  async saveToFile(
    releases: MusicRelease[],
    filename = "spotify_releases.json"
  ): Promise<void> {
    try {
      const jsonData = JSON.stringify(releases, null, 2);
      await fs.writeFile(filename, jsonData, "utf-8");
      console.log(`💾 Релізи збережено у файл: ${filename}`);
    } catch (error) {
      console.error("Помилка збереження файлу:", error);
      throw error;
    }
  }

  /**
   * Зберігає релізи у CSV файл
   */
  async saveToCsv(
    releases: MusicRelease[],
    filename = "spotify_releases.csv"
  ): Promise<void> {
    try {
      const headers = [
        "Artist",
        "Title",
        "Release Date",
        "Type",
        "Total Tracks",
        "Popularity",
        "Genres",
        "URL",
      ];

      const csvRows = [headers.join(",")];

      for (const release of releases) {
        const row = [
          this.escapeCsvField(release.artist),
          this.escapeCsvField(release.title),
          release.releaseDate,
          release.type,
          release.totalTracks.toString(),
          (release.popularity || 0).toString(),
          this.escapeCsvField(release.genres.join("; ")),
          release.url,
        ];
        csvRows.push(row.join(","));
      }

      await fs.writeFile(filename, csvRows.join("\n"), "utf-8");
      console.log(`📊 CSV файл збережено: ${filename}`);
    } catch (error) {
      console.error("Помилка збереження CSV:", error);
      throw error;
    }
  }

  /**
   * Виводить релізи у консоль
   */
  printReleases(releases: MusicRelease[]): void {
    console.log("\n" + "=".repeat(80));
    console.log("🎵 ЗНАЙДЕНІ МУЗИЧНІ РЕЛІЗИ");
    console.log("=".repeat(80));

    for (const release of releases) {
      console.log(`📅 ${release.releaseDate}`);
      console.log(`🎵 ${release.artist} - ${release.title}`);
      console.log(
        `📀 ${release.type.toUpperCase()}, ${release.totalTracks} треків`
      );

      if (release.popularity !== undefined) {
        console.log(`⭐ Популярність: ${release.popularity}/100`);
      }

      if (release.genres.length > 0) {
        console.log(`🏷️  Жанри: ${release.genres.join(", ")}`);
      }

      console.log(`🔗 ${release.url}`);
      console.log("-".repeat(50));
    }
  }

  /**
   * Виводить статистику
   */
  printStats(stats: ScrapingStats): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 СТАТИСТИКА");
    console.log("=".repeat(60));

    console.log(`🎯 Всього релізів: ${stats.totalReleases}`);
    console.log(
      `⏱️  Час обробки: ${(stats.processingTime / 1000).toFixed(1)} секунд`
    );

    console.log("\nПо типах:");
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(
        `📀 ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`
      );
    });

    console.log("\nПо артистах:");
    const sortedArtists = Object.entries(stats.byArtist)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    sortedArtists.forEach(([artist, count]) => {
      console.log(`🎤 ${artist}: ${count} релізів`);
    });
  }

  /**
   * Допоміжні методи
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getCountByProperty<T>(
    array: T[],
    property: keyof T
  ): Record<string, number> {
    return array.reduce(
      (acc, item) => {
        const key = String(item[property]);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
