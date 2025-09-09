import * as dotenv from 'dotenv';
import { SpotifyService } from './services/spotify.js';
import { ReleaseScraper } from './services/scraper.js';
import { ScrapingOptions } from './types/index.js';
import { readFile } from 'fs/promises';
import { BlueskyService } from './services/bluesky.js';
import translateAlbumType from './helpers/translate-album-type.js';
import { TelegramService } from './services/telegram.js';

// Завантажуємо змінні середовища
dotenv.config();

async function main(): Promise<void> {
  try {
    // Конфігурація Spotify API
    const spotifyConfig = {
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    };

    if (!spotifyConfig.clientId || !spotifyConfig.clientSecret) {
      throw new Error(
        'Відсутні SPOTIFY_CLIENT_ID або SPOTIFY_CLIENT_SECRET у .env файлі',
      );
    }
    // Зчитати шлях до файлу з артистами з командного рядка або використовувати за замовчуванням
    const artistsFilePath =
      process.argv[2] && process.argv[2].trim() !== ''
        ? process.argv[2]
        : './artists.txt';

    // Список артистів
    const artists = await readFile(artistsFilePath, 'utf-8').then((data) =>
      data
        // Окремі артисти на різних рядках
        .split('\n')
        // Видаляємо зайві пробільні символи
        .map((line) => line.trim())
        // Видаляємо порожні рядки
        .filter((line) => line.length > 0)
        // Видаляємо дублікати
        .filter((line, index, self) => self.indexOf(line) === index),
    );

    if (artists.length === 0) {
      throw new Error('Файл artists.txt порожній або не містить жодних назв');
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

    // Зберігаємо у файли
    await scraper.saveToFile(releases);
    await scraper.saveToCsv(
      releases,
      `archive/releases_${options.startDate}.csv`,
    );

    const summaryLines =
      releases.length === 0
        ? [
            '🚀 Сьогодні нових релізів немає! 🚀',
            'Залишайтеся з нами, поки продовжуючи слухати класику! 🎵🇺🇦',
          ]
        : [
            `Всі нові релізи за ${options.startDate}, всього ${releases.length}💿, або ${releases.reduce((result, item) => result + item.totalTracks, 0)}🎵`,
            '',
            ...releases.map(
              (r) =>
                `- ${r.artist} — ${r.title} (${translateAlbumType(r.type)})`,
            ),
            '',
            'Далі буде більше! 🚀',
          ];

    const summaryText = summaryLines.join('\n');
    // Публікація у Bluesky

    const bluesky = new BlueskyService({
      service: 'https://bsky.social',
      identifier: process.env.BLUESKY_IDENTIFIER!, // або email
      password: process.env.BLUESKY_PASSWORD!, // використовуйте App Password, не основний пароль!
    });

    await bluesky.login();

    const telegram = new TelegramService({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      channelId: '@ukraiinskanova', // або ID чату
    });

    const botInfo = await telegram.getBotInfo();
    console.log(`🤖 Бот: @${botInfo.username}`);

    console.log('\n📝 Підготовка до публікації у Bluesky і Telegram:');
    console.log(summaryText);

    if (!process.env.DEBUG) {
      console.log('\n🚀 Публікація у Bluesky і Telegram...');

      await Promise.all([
        bluesky.publishText(summaryText),
        telegram.sendToChannel(summaryText),
      ]);
    }

    console.log('\n✅ Обробка завершена!');
  } catch (error) {
    console.error('❌ Помилка виконання скрипта:', error);
    process.exit(1);
  }
}

void main();
