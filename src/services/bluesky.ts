import { AtpAgent, BlobRef } from "@atproto/api";

interface BlueskyConfig {
  service: string;
  identifier: string;
  password: string;
}

interface ThreadPost {
  text: string;
  reply?: {
    root: { uri: string; cid: string };
    parent: { uri: string; cid: string };
  };
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
      service: config.service || "https://bsky.social",
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
      console.log("✅ Успішно авторизовано в Bluesky");
    } catch (error) {
      console.error("❌ Помилка авторизації:", error);
      throw new Error("Не вдалося авторизуватися в Bluesky");
    }
  }

  /**
   * Підрахунок довжини тексту з урахуванням Unicode символів
   */
  private getTextLength(text: string): number {
    // Використовуємо Array.from для коректного підрахунку Unicode символів
    return Array.from(text).length;
  }

  /**
   * Розбиття тексту на частини для треду з урахуванням Unicode
   */
  private splitTextForThread(text: string): string[] {
    const parts: string[] = [];
    const textArray = Array.from(text);

    let currentPart = "";
    let i = 0;

    while (i < textArray.length) {
      const char = textArray[i];
      const testPart = currentPart + char;

      if (this.getTextLength(testPart) <= this.MAX_POST_LENGTH) {
        currentPart = testPart;
        i++;
      } else {
        if (currentPart) {
          // Шукаємо останній пробіл або розділовий знак для розриву
          //   const lastSpaceIndex = currentPart.lastIndexOf(" ");
          const lastNewlineIndex = currentPart.lastIndexOf("\n");
          //   const breakIndex = Math.max(lastSpaceIndex, lastNewlineIndex);
          const breakIndex = lastNewlineIndex;

          if (breakIndex > 0 && breakIndex > currentPart.length - 50) {
            // Розриваємо по пробілу/новому рядку
            parts.push(currentPart.substring(0, breakIndex).trim());
            currentPart = currentPart.substring(breakIndex + 1) + char;
          } else {
            // Розриваємо примусово
            parts.push(currentPart.trim());
            currentPart = char;
          }
        } else {
          // Якщо навіть один символ не поміщається (не повинно трапитися)
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
   * Публікація одного поста
   */
  private async createPost(
    text: string,
    reply?: {
      root: { uri: string; cid: string };
      parent: { uri: string; cid: string };
    }
  ): Promise<{ uri: string; cid: string }> {
    if (!this.isAuthenticated) {
      throw new Error("Потрібно спочатку авторизуватися");
    }

    try {
      const response = await this.agent.post({
        text: text,
        reply: reply,
        createdAt: new Date().toISOString(),
      });

      return {
        uri: response.uri,
        cid: response.cid,
      };
    } catch (error) {
      console.error("❌ Помилка публікації поста:", error);
      throw error;
    }
  }

  /**
   * Публікація тексту (автоматично створює тред якщо потрібно)
   */
  async publishText(
    text: string
  ): Promise<{ success: boolean; posts: Array<{ uri: string; cid: string }> }> {
    if (!this.isAuthenticated) {
      await this.login();
    }

    const textLength = this.getTextLength(text);
    const posts: Array<{ uri: string; cid: string }> = [];

    try {
      if (textLength <= this.MAX_POST_LENGTH) {
        // Простий пост
        console.log("📝 Публікуємо звичайний пост...");
        const post = await this.createPost(text);
        posts.push(post);
        console.log("✅ Пост опубліковано!");
      } else {
        // Створюємо тред
        console.log("🧵 Створюємо тред з кількох постів...");
        const textParts = this.splitTextForThread(text);
        console.log(`📊 Розбито на ${textParts.length} частин`);

        let rootPost: { uri: string; cid: string } | null = null;
        let parentPost: { uri: string; cid: string } | null = null;

        for (let i = 0; i < textParts.length; i++) {
          const partText = textParts[i];
          const isFirst = i === 0;

          console.log(
            `📤 Публікуємо частину ${i + 1}/${textParts.length} (${this.getTextLength(partText)} символів)`
          );

          const reply =
            !isFirst && rootPost && parentPost
              ? {
                  root: rootPost,
                  parent: parentPost,
                }
              : undefined;

          const post = await this.createPost(partText, reply);
          posts.push(post);

          if (isFirst) {
            rootPost = post;
          }
          parentPost = post;

          // Невелика затримка між постами
          if (i < textParts.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        console.log("✅ Тред опубліковано!");
      }

      return { success: true, posts };
    } catch (error) {
      console.error("❌ Помилка публікації:", error);
      return { success: false, posts };
    }
  }

  /**
   * Отримання інформації про профіль
   */
  async getProfile(): Promise<any> {
    if (!this.isAuthenticated) {
      await this.login();
    }

    try {
      const response = await this.agent.getProfile({
        actor: this.config.identifier,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Помилка отримання профілю:", error);
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
