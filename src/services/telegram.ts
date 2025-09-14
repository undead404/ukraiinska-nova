import TelegramBot from 'node-telegram-bot-api';

import getTextLength from '../helpers/get-text-length.js';
import splitTextForMessages from '../helpers/split-text-for-messages.js';

interface TelegramConfig {
  token: string;
  channelId?: string; // ID каналу або чату (опціонально)
}

interface SendResult {
  success: boolean;
  messages: TelegramBot.Message[];
  error?: string;
}

interface ParseModeOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}
// Telegram має ліміт 4096 символів на повідомлення
const MAX_MESSAGE_LENGTH = 4096;

// Ліміт для підписів під медіа
const MAX_CAPTION_LENGTH = 1024;

export class TelegramService {
  private bot: TelegramBot;
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.token, { polling: false });
  }

  /**
   * Відправка одного повідомлення
   */
  private async sendSingleMessage(
    chatId: string | number,
    text: string,
    options: TelegramBot.SendMessageOptions = {},
  ): Promise<TelegramBot.Message> {
    try {
      const message = await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      });
      return message;
    } catch (error) {
      console.error('❌ Помилка відправки повідомлення:', error);
      throw error;
    }
  }

  /**
   * Відправка тексту (автоматично розбиває на кілька повідомлень якщо потрібно)
   */
  async sendText(
    chatId: string | number,
    text: string,
    options: ParseModeOptions & { delay?: number } = {},
  ): Promise<SendResult> {
    const messages: TelegramBot.Message[] = [];
    const delay = options.delay || 500; // Затримка між повідомленнями в мс

    try {
      const textLength = getTextLength(text);

      if (textLength <= MAX_MESSAGE_LENGTH) {
        console.log('📝 Відправляємо звичайне повідомлення...');
        const message = await this.sendSingleMessage(chatId, text, options);
        messages.push(message);
        console.log('✅ Повідомлення відправлено!');
      } else {
        const textParts = splitTextForMessages(text, MAX_MESSAGE_LENGTH);
        console.log(`📨 Розбиваємо на ${textParts.length} частин`);
        await this.sendMultipleMessages(
          chatId,
          textParts,
          options,
          delay,
          messages,
        );
      }

      return { success: true, messages };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Невідома помилка';
      console.error('❌ Помилка відправки:', error);
      return { success: false, messages, error: errorMessage };
    }
  }

  private async sendMultipleMessages(
    chatId: string | number,
    textParts: string[],
    options: ParseModeOptions,
    delay: number,
    messages: TelegramBot.Message[],
  ): Promise<void> {
    for (let index = 0; index < textParts.length; index++) {
      const partText = textParts[index];
      const isFirst = index === 0;
      const isLast = index === textParts.length - 1;

      let finalText = partText;
      if (textParts.length > 1) {
        if (isFirst) {
          finalText = `${partText}\n\n<i>📎 Продовження нижче... (1/${textParts.length})</i>`;
        } else if (isLast) {
          finalText = `<i>📎 Продовження (${index + 1}/${textParts.length})</i>\n\n${partText}`;
        } else {
          finalText = `<i>📎 Продовження (${index + 1}/${textParts.length})</i>\n\n${partText}\n\n<i>📎 Продовження нижче...</i>`;
        }
      }

      console.log(
        `📤 Відправляємо частину ${index + 1}/${textParts.length} (${getTextLength(partText)} символів)`,
      );

      const message = await this.sendSingleMessage(chatId, finalText, options);
      messages.push(message);

      if (index < textParts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.log('✅ Всі повідомлення відправлено!');
  }

  /**
   * Відправка в канал (якщо налаштовано)
   */
  async sendToChannel(
    text: string,
    options: ParseModeOptions & { delay?: number } = {},
    image?: { imageUrl: string; altText: string },
  ): Promise<SendResult> {
    if (!this.config.channelId) {
      throw new Error('ID каналу не налаштовано в конфігурації');
    }

    if (image) {
      return this.sendPhoto(this.config.channelId, image.imageUrl, text);
    }

    return this.sendText(this.config.channelId, text, options);
  }

  /**
   * Відправка фото з підписом (з автоматичним розбиттям підпису)
   */
  async sendPhoto(
    chatId: string | number,
    photo: string | Buffer,
    caption?: string,
    options: TelegramBot.SendPhotoOptions = {},
  ): Promise<SendResult> {
    const messages: TelegramBot.Message[] = [];

    try {
      if (!caption || getTextLength(caption) <= MAX_CAPTION_LENGTH) {
        // Звичайне фото з підписом
        const message = await this.bot.sendPhoto(chatId, photo, {
          caption: caption,
          parse_mode: 'HTML',
          ...options,
        });
        messages.push(message);
        console.log('✅ Фото відправлено!');
      } else {
        // Фото + довгий підпис як окремі повідомлення
        console.log('📷 Відправляємо фото з довгим підписом...');

        // Спочатку фото без підпису
        const photoMessage = await this.bot.sendPhoto(chatId, photo, options);
        messages.push(photoMessage);

        // Потім підпис як текстове повідомлення
        await new Promise((resolve) => setTimeout(resolve, 300));
        const textResult = await this.sendText(chatId, caption);
        messages.push(...textResult.messages);
      }

      return { success: true, messages };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Невідома помилка';
      console.error('❌ Помилка відправки фото:', error);
      return { success: false, messages, error: errorMessage };
    }
  }

  /**
   * Отримання інформації про бота
   */
  async getBotInfo(): Promise<TelegramBot.User> {
    try {
      const botInfo = await this.bot.getMe();
      return botInfo;
    } catch (error) {
      console.error('❌ Помилка отримання інформації про бота:', error);
      throw error;
    }
  }

  /**
   * Отримання інформації про чат
   */
  async getChatInfo(chatId: string | number): Promise<TelegramBot.Chat> {
    try {
      const chatInfo = await this.bot.getChat(chatId);
      return chatInfo;
    } catch (error) {
      console.error('❌ Помилка отримання інформації про чат:', error);
      throw error;
    }
  }

  /**
   * Форматування тексту для Telegram HTML
   */
  static formatHTML(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  /**
   * Додавання жирного тексту
   */
  static bold(text: string): string {
    return `<b>${this.formatHTML(text)}</b>`;
  }

  /**
   * Додавання курсиву
   */
  static italic(text: string): string {
    return `<i>${this.formatHTML(text)}</i>`;
  }

  /**
   * Додавання коду
   */
  static code(text: string): string {
    return `<code>${this.formatHTML(text)}</code>`;
  }

  /**
   * Додавання посилання
   */
  static link(text: string, url: string): string {
    return `<a href="${url}">${this.formatHTML(text)}</a>`;
  }

  /**
   * Перевірка валідності токену
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getBotInfo();
      return true;
    } catch {
      return false;
    }
  }
}
