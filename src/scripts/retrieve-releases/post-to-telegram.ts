import { TelegramService } from '../../services/telegram.js';
import type { EnhancedMusicRelease } from '../../types/index.js';

import environment from './environment.js';
import mapReleasesToPosts from './map-releases-to-posts.js';

const telegram = new TelegramService({
  token: environment.TELEGRAM_BOT_TOKEN || '',
  channelId: '@ukraiinskanova', // або ID чату
});

const botInfo = await telegram.getBotInfo();
console.log(`🤖 Бот: @${botInfo.username}`);

export default async function postToTelegram(releases: EnhancedMusicRelease[]) {
  const posts = mapReleasesToPosts(releases);

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
}
