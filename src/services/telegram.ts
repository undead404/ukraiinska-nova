import TelegramBot from 'node-telegram-bot-api';

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

export class TelegramService {
  private bot: TelegramBot;
  private config: TelegramConfig;

  // Telegram має ліміт 4096 символів на повідомлення
  private readonly MAX_MESSAGE_LENGTH = 4096;

  // Ліміт для підписів під медіа
  private readonly MAX_CAPTION_LENGTH = 1024;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.token, { polling: false });
  }

  /**
   * Підрахунок довжини тексту з урахуванням Unicode символів
   */
  private getTextLength(text: string): number {
    return Array.from(text).length;
  }

  /**
   * Розбиття тексту на частини з урахуванням Unicode
   */
  private splitTextForMessages(
    text: string,
    maxLength: number = this.MAX_MESSAGE_LENGTH,
  ): string[] {
    const parts: string[] = [];
    const textArray = Array.from(text);

    let currentPart = '';
    let i = 0;

    while (i < textArray.length) {
      const char = textArray[i];
      const testPart = currentPart + char;

      if (this.getTextLength(testPart) <= maxLength) {
        currentPart = testPart;
        i++;
      } else {
        if (currentPart) {
          // Шукаємо найкраще місце для розриву
          const breakPoints = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '];
          let bestBreakIndex = -1;
          let bestBreakLength = 0;

          for (const breakPoint of breakPoints) {
            const lastIndex = currentPart.lastIndexOf(breakPoint);
            if (
              lastIndex > bestBreakIndex &&
              lastIndex > currentPart.length - 100
            ) {
              bestBreakIndex = lastIndex;
              bestBreakLength = breakPoint.length;
              break; // Використовуємо перший знайдений (найкращий)
            }
          }

          if (bestBreakIndex > 0) {
            // Розриваємо по знайденому розділовому символу
            parts.push(
              currentPart.substring(0, bestBreakIndex + bestBreakLength).trim(),
            );
            currentPart =
              currentPart.substring(bestBreakIndex + bestBreakLength) + char;
          } else {
            // Розриваємо примусово
            parts.push(currentPart.trim());
            currentPart = char;
          }
        } else {
          currentPart = char;
        }
        i++;
      }
    }

    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }

    return parts.filter((part) => part.length > 0);
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
      const textLength = this.getTextLength(text);

      if (textLength <= this.MAX_MESSAGE_LENGTH) {
        // Просте повідомлення
        console.log('📝 Відправляємо звичайне повідомлення...');
        const message = await this.sendSingleMessage(chatId, text, options);
        messages.push(message);
        console.log('✅ Повідомлення відправлено!');
      } else {
        // Розбиваємо на кілька повідомлень
        console.log('📨 Розбиваємо на кілька повідомлень...');
        const textParts = this.splitTextForMessages(text);
        console.log(`📊 Розбито на ${textParts.length} частин`);

        for (let i = 0; i < textParts.length; i++) {
          const partText = textParts[i];
          const isFirst = i === 0;
          const isLast = i === textParts.length - 1;

          // Додаємо індикатори частин якщо більше одного повідомлення
          let finalText = partText;
          if (textParts.length > 1) {
            if (isFirst) {
              finalText = `${partText}\n\n<i>📎 Продовження нижче... (1/${textParts.length})</i>`;
            } else if (isLast) {
              finalText = `<i>📎 Продовження (${i + 1}/${textParts.length})</i>\n\n${partText}`;
            } else {
              finalText = `<i>📎 Продовження (${i + 1}/${textParts.length})</i>\n\n${partText}\n\n<i>📎 Продовження нижче...</i>`;
            }
          }

          console.log(
            `📤 Відправляємо частину ${i + 1}/${textParts.length} (${this.getTextLength(partText)} символів)`,
          );

          const message = await this.sendSingleMessage(
            chatId,
            finalText,
            options,
          );
          messages.push(message);

          // Затримка між повідомленнями (крім останнього)
          if (i < textParts.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        console.log('✅ Всі повідомлення відправлено!');
      }

      return { success: true, messages };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Невідома помилка';
      console.error('❌ Помилка відправки:', error);
      return { success: false, messages, error: errorMessage };
    }
  }

  /**
   * Відправка в канал (якщо налаштовано)
   */
  async sendToChannel(
    text: string,
    options: ParseModeOptions & { delay?: number } = {},
  ): Promise<SendResult> {
    if (!this.config.channelId) {
      throw new Error('ID каналу не налаштовано в конфігурації');
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
      if (!caption || this.getTextLength(caption) <= this.MAX_CAPTION_LENGTH) {
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
