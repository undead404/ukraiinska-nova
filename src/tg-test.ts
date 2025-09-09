import { TelegramService } from './services/telegram';
import { config } from 'dotenv';

// Завантажуємо змінні середовища
config();

// Приклад використання
async function main() {
  const telegram = new TelegramService({
    token: process.env.TELEGRAM_BOT_TOKEN!,
    channelId: '@ukraiinskanova', // або ID чату
  });

  try {
    // Перевірка токену
    const isValid = await telegram.validateToken();
    if (!isValid) {
      throw new Error('Невалідний токен бота');
    }

    // Отримання інформації про бота
    const botInfo = await telegram.getBotInfo();
    console.log(`🤖 Бот: @${botInfo.username}`);

    // Короткий текст
    const chatId = '@ukraiinskanova'; // або числовий ID
    const shortText =
      'Привіт, Telegram! 🤖 Це тестове повідомлення з українським текстом.';
    await telegram.sendText(chatId, shortText);

    // Використання каналу
    await telegram.sendToChannel('Повідомлення в канал 📢');

    // Довгий текст з форматуванням
    const longText = `
  ${TelegramService.bold('Тестування довгого повідомлення')}
  
  Цей сервіс для Telegram підтримує:
  ✅ Unicode символи (українські, емодзі тощо)
  ✅ Автоматичне розбиття на повідомлення
  ✅ HTML форматування
  ✅ Розумне розбиття тексту
  
  ${TelegramService.italic('Особливості:')}
  • Максимум 4096 символів на повідомлення
  • Розбиття по абзацах та реченнях
  • Індикатори продовження
  • Затримки між повідомленнями
  
  ${TelegramService.code('Технічні деталі:')}
  Коли текст перевищує ліміт Telegram (4096 символів), він автоматично 
  розбивається на кілька повідомлень. Сервіс намагається розбивати по 
  абзацах або реченнях для зручності читання.
  
  ${TelegramService.link('Документація Telegram Bot API', 'https://core.telegram.org/bots/api')}
  
  Цей текст буде розбито на кілька повідомлень з індикаторами продовження.
      `.trim();

    await telegram.sendText(chatId, longText, { delay: 1000 });
  } catch (error) {
    console.error('Помилка:', error);
  }
}

// Експорт для використання
void main();
