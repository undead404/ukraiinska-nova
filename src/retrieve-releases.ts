import * as dotenv from 'dotenv';
import { nonEmpty, object, parse, pipe, string } from 'valibot';

import readFileArtistIds from './read-artist-ids.js';
import { getReleaseTags } from './services/lastfm.js';
import { ReleaseScraper } from './services/scraper.js';
import { SpotifyService } from './services/spotify.js';
import { ScrapingOptions } from './types/index.js';

dotenv.config();

const environmentSchema = object({
  LASTFM_API_KEY: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_ID: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_SECRET: pipe(string(), nonEmpty()),
});

const environment = parse(environmentSchema, process.env);

async function main(): Promise<void> {
  try {
    // Конфігурація Spotify API
    const spotifyConfig = {
      clientId: environment.SPOTIFY_CLIENT_ID,
      clientSecret: environment.SPOTIFY_CLIENT_SECRET,
    };

    // Зчитати шлях до файлу з артистами з командного рядка або використовувати за замовчуванням
    const artistsFilePath =
      process.argv[2] && process.argv[2].trim() !== ''
        ? process.argv[2]
        : './artist-ids.csv';

    const artists = await readFileArtistIds(artistsFilePath);
    if (artists.length === 0) {
      throw new Error('Список артистів порожній. Додайте артистів у файл.');
    }

    // Налаштування періоду (літо 2025)
    // const endDate = new Date(2025, 7, 31).toISOString().split("T")[0];
    // const endDate = "2025-09-06";
    // const startDate = new Date();
    // startDate.setFullYear(2025, 5, 1); // Встановлюємо початок літа 2025
    // const startDateStr = startDate.toISOString().split("T")[0];
    // const startDateStr = "2025-09-06";

    // Вчорашня дата
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    console.log(`📅 Цільова дата: ${targetDateStr}`);

    const options: ScrapingOptions = {
      startDate: targetDateStr,
      endDate: targetDateStr,
      includeCompilations: false,
      includeAppears: true,
      country: 'UA',
    };

    // Ініціалізація сервісів
    console.log('🎵 Ініціалізація Ukraiinska Nova');
    console.log('='.repeat(50));

    const spotifyService = new SpotifyService(spotifyConfig);
    const scraper = new ReleaseScraper(spotifyService);

    // Збираємо релізи
    const { releases, stats } = await scraper.scrapeReleases(artists, options);

    // Виводимо результати
    scraper.printReleases(releases);
    scraper.printStats(stats);

    for (const release of releases) {
      release.tags = await getReleaseTags(environment.LASTFM_API_KEY, release);
    }
    // Зберігаємо у файли
    await scraper.saveToFile(releases);
    await scraper.saveToFile(
      releases,
      `archive/releases_${options.startDate}.json`,
    );
    await scraper.saveToCsv(
      releases,
      `archive/releases_${options.startDate}.csv`,
    );

    console.log('\n✅ Обробка завершена!');
  } catch (error) {
    console.error('❌ Помилка виконання скрипта:', error);
    process.exit(1);
  }
}

void main();
