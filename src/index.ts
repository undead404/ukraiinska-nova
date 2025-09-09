import environment from './environment.js';
import hashtagify from './helpers/hashtagify.js';
import joinArtists from './helpers/join-artists.js';
import translateAlbumType from './helpers/translate-album-type.js';
import readFileArtists from './read-artists.js';
import { BlueskyService } from './services/bluesky.js';
import { getReleaseTags } from './services/lastfm.js';
import { ReleaseScraper } from './services/scraper.js';
import { SpotifyService } from './services/spotify.js';
import { TelegramService } from './services/telegram.js';
import { ScrapingOptions } from './types/index.js';

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
        : './artists.txt';

    const artists = await readFileArtists(artistsFilePath);
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

    // Зберігаємо у файли
    await scraper.saveToFile(releases);
    await scraper.saveToCsv(
      releases,
      `archive/releases_${options.startDate}.csv`,
    );

    for (const release of releases) {
      release.tags = await getReleaseTags(release);
    }

    const posts: Array<{
      imageUrl?: string;
      links?: Array<{ title: string; url: string }>;
      text: string;
    }> =
      releases.length === 0
        ? [
            {
              text: `🚀 Сьогодні нових релізів немає! 🚀\nЗалишайтеся з нами, поки продовжуючи слухати класику! 🎵🇺🇦`,
            },
          ]
        : releases.map((release) => ({
            imageUrl: release.imageUrl,
            links: [
              {
                title: 'SPOTIFY',
                url: release.url,
              },
            ],
            text: `🎤 ${joinArtists(release.artists)}\n💿 ${release.title} (${translateAlbumType(
              release.type,
            )})\n\n${release.tags?.map((tag) => `#${hashtagify(tag)}`).join(' ')}`,
          }));
    // Публікація у Bluesky

    const bluesky = new BlueskyService({
      service: 'https://bsky.social',
      identifier: environment.BLUESKY_IDENTIFIER, // або email
      password: environment.BLUESKY_PASSWORD, // використовуйте App Password, не основний пароль!
    });

    await bluesky.login();

    const telegram = new TelegramService({
      token: environment.TELEGRAM_BOT_TOKEN || '',
      channelId: '@ukraiinskanova', // або ID чату
    });

    const botInfo = await telegram.getBotInfo();
    console.log(`🤖 Бот: @${botInfo.username}`);

    console.log('\n📝 Підготовка до публікації у Bluesky і Telegram:');
    console.log(posts);

    if (!environment.DEBUG) {
      console.log('\n🚀 Публікація у Bluesky і Telegram...');

      let rootPost: { uri: string; cid: string } | undefined = undefined;
      let previousPost: { uri: string; cid: string } | undefined = undefined;

      for (const post of posts) {
        const { posts: publishedPosts } = await bluesky.publishText(
          post.text +
            // add links if any
            (post.links && post.links.length > 0
              ? '\n' +
                post.links
                  .map((link) => `${link.title}: ${link.url}`)
                  .join('\n')
              : ''),
          rootPost && previousPost
            ? { root: rootPost, parent: previousPost }
            : undefined,
          post.imageUrl
            ? { imageUrl: post.imageUrl, altText: 'Обкладинка релізу' }
            : undefined,
        );
        previousPost = publishedPosts.at(-1);
        if (!rootPost) {
          rootPost = previousPost;
        }

        // Повідомлення в Telegram
        await telegram.sendToChannel(
          post.text +
            (post.links && post.links.length > 0
              ? '\n' +
                post.links
                  .map((link) => `${link.title}: ${link.url}`)
                  .join('\n')
              : ''),
          {},
          post.imageUrl
            ? { imageUrl: post.imageUrl, altText: 'Обкладинка релізу' }
            : undefined,
        );
      }
    }

    console.log('\n✅ Обробка завершена!');
  } catch (error) {
    console.error('❌ Помилка виконання скрипта:', error);
    process.exit(1);
  }
}

void main();
