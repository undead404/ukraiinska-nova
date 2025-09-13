import * as dotenv from 'dotenv';
import { nonEmpty, object, parse, pipe, string } from 'valibot';

import hashtagify from './helpers/hashtagify.js';
import joinArtists from './helpers/join-artists.js';
import translateAlbumType from './helpers/translate-album-type.js';
import translatePopularity from './helpers/translate-popularity.js';
import openTodayReleases from './open-today-releases.js';
import { TelegramService } from './services/telegram.js';
dotenv.config();

const environmentSchema = object({
  TELEGRAM_BOT_TOKEN: pipe(string(), nonEmpty()),
});

const environment = parse(environmentSchema, process.env);

const { releases } = await openTodayReleases();

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
        text: `${translatePopularity(release.artistsPopularity)}🎤 ${joinArtists(release.artists)}\n💿 ${release.title} (${translateAlbumType(
          release.type,
        )})\n\n${release.tags?.map((tag) => `#${hashtagify(tag)}`).join(' ')}`,
      }));

const telegram = new TelegramService({
  token: environment.TELEGRAM_BOT_TOKEN || '',
  channelId: '@ukraiinskanova', // або ID чату
});

const botInfo = await telegram.getBotInfo();
console.log(`🤖 Бот: @${botInfo.username}`);
console.log('\n🚀 Публікація у Telegram...');

for (const post of posts) {
  // Повідомлення в Telegram
  await telegram.sendToChannel(
    post.text +
      (post.links && post.links.length > 0
        ? '\n' +
          post.links.map((link) => `${link.title}: ${link.url}`).join('\n')
        : ''),
    {},
    post.imageUrl
      ? { imageUrl: post.imageUrl, altText: 'Обкладинка релізу' }
      : undefined,
  );
}
