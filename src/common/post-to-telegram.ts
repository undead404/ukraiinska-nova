import { TelegramService } from '../services/telegram.js';
import type { Post } from '../types/index.js';

export default async function postToTelegram(
  token: string,
  channelId: string,
  posts: Post[],
) {
  const telegram = new TelegramService({
    token: token,
    channelId: channelId, // або ID чату
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
}
