import {
  AtpAgent,
  type ComAtprotoRepoUploadBlob,
  RichText,
} from '@atproto/api';
import delay from 'src/helpers/delay.js';

import getTextLength from '../helpers/get-text-length.js';
import splitTextForThread from '../helpers/split-text.js';

interface BlueskyConfig {
  service: string;
  identifier: string;
  password: string;
}

export class BlueskyService {
  private agent: AtpAgent;
  private config: BlueskyConfig;
  private isAuthenticated: boolean = false;

  // Bluesky має ліміт 300 символів на пост
  private readonly MAX_POST_LENGTH = 300;

  constructor(config: BlueskyConfig) {
    this.config = config;
    this.agent = new AtpAgent({
      service: config.service || 'https://bsky.social',
    });
  }

  /**
   * Авторизація в Bluesky
   */
  async login(): Promise<void> {
    try {
      await this.agent.login({
        identifier: this.config.identifier,
        password: this.config.password,
      });
      this.isAuthenticated = true;
      console.log('✅ Успішно авторизовано в Bluesky');
    } catch (error) {
      console.error('❌ Помилка авторизації:', error);
      throw new Error('Не вдалося авторизуватися в Bluesky');
    }
  }

  /**
   * Публікація одного поста
   */
  private async createPost(
    text: string,
    reply?: {
      root: { uri: string; cid: string };
      parent: { uri: string; cid: string };
    },
    image?: { imageUrl: string; altText: string },
  ): Promise<{ uri: string; cid: string }> {
    if (!this.isAuthenticated) {
      throw new Error('Потрібно спочатку авторизуватися');
    }

    let imageBlob: ComAtprotoRepoUploadBlob.Response | undefined;
    if (image) {
      const imageResponse = await fetch(image.imageUrl);
      imageBlob = await this.agent.uploadBlob(await imageResponse.blob());
    }

    const richText = new RichText({ text });

    await richText.detectFacets(this.agent);

    try {
      const response = await this.agent.post({
        // add image to the post
        embed:
          image && imageBlob
            ? {
                $type: 'app.bsky.embed.images',
                images: [
                  {
                    image: imageBlob.data.blob,
                    alt: image.altText,
                  },
                ],
              }
            : undefined,
        facets: richText.facets,
        text: richText.text,
        reply: reply,
        createdAt: new Date().toISOString(),
      });

      return {
        uri: response.uri,
        cid: response.cid,
      };
    } catch (error) {
      console.error('❌ Помилка публікації поста:', error);
      throw error;
    }
  }

  private async publishThread(
    text: string,
    previous?: {
      root: { uri: string; cid: string };
      parent: { uri: string; cid: string };
    },
    image?: { imageUrl: string; altText: string },
  ): Promise<{ success: boolean; posts: Array<{ uri: string; cid: string }> }> {
    const posts: Array<{ uri: string; cid: string }> = [];
    console.log('🧵 Створюємо тред з кількох постів...');
    const textParts = splitTextForThread(text, this.MAX_POST_LENGTH);
    console.log(`📊 Розбито на ${textParts.length} частин`);

    let rootPost: { uri: string; cid: string } | undefined =
      previous?.root ?? undefined;
    let parentPost: { uri: string; cid: string } | undefined =
      previous?.parent ?? undefined;

    for (let index = 0; index < textParts.length; index++) {
      const partText = textParts[index];
      const isFirst = index === 0;

      console.log(
        `📤 Публікуємо частину ${index + 1}/${textParts.length} (${getTextLength(partText)} символів)`,
      );

      const reply =
        rootPost && parentPost
          ? {
              root: rootPost,
              parent: parentPost,
            }
          : undefined;

      const post = await (index === 0
        ? this.createPost(partText, reply, image)
        : this.createPost(partText, reply));
      posts.push(post);

      if (isFirst) {
        rootPost = post;
      }
      parentPost = post;

      // Невелика затримка між постами
      if (index < textParts.length - 1) {
        await delay(1000);
      }
    }

    console.log('✅ Тред опубліковано!');
    return { success: true, posts };
  }

  /**
   * Публікація тексту (автоматично створює тред якщо потрібно)
   */
  async publishText(
    text: string,
    previous?: {
      root: { uri: string; cid: string };
      parent: { uri: string; cid: string };
    },
    image?: { imageUrl: string; altText: string },
  ): Promise<{ success: boolean; posts: Array<{ uri: string; cid: string }> }> {
    if (!this.isAuthenticated) {
      await this.login();
    }

    const textLength = getTextLength(text);
    const posts: Array<{ uri: string; cid: string }> = [];

    try {
      if (textLength <= this.MAX_POST_LENGTH) {
        // Простий пост
        console.log('📝 Публікуємо звичайний пост...');
        const post = await this.createPost(text, previous, image);
        posts.push(post);
        console.log('✅ Пост опубліковано!');
      } else {
        return await this.publishThread(text, previous, image);
      }

      return { success: true, posts };
    } catch (error) {
      console.error('❌ Помилка публікації:', error);
      return { success: false, posts };
    }
  }

  /**
   * Отримання інформації про профіль
   */
  async getProfile() {
    if (!this.isAuthenticated) {
      await this.login();
    }

    try {
      const response = await this.agent.getProfile({
        actor: this.config.identifier,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Помилка отримання профілю:', error);
      throw error;
    }
  }

  /**
   * Перевірка статусу з'єднання
   */
  isConnected(): boolean {
    return this.isAuthenticated;
  }
}
