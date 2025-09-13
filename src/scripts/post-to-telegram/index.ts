import openTodayReleases from '../../open-today-releases.js';
import { TelegramService } from '../../services/telegram.js';

import environment from './environment.js';
import mapReleasesToPosts from './map-releases-to-posts.js';

const { releases } = await openTodayReleases();

const posts = mapReleasesToPosts(releases);

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
