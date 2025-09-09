import { BlueskyService } from './services/bluesky';
import environment from './environment';

async function main() {
  const bluesky = new BlueskyService({
    service: 'https://bsky.social',
    identifier: environment.BLUESKY_IDENTIFIER, // або email
    password: environment.BLUESKY_PASSWORD, // використовуйте App Password, не основний пароль!
  });

  try {
    // Авторизація
    await bluesky.login();

    // Короткий текст
    const shortText =
      'Привіт, світ! 🌍 Це тестовий пост з українським текстом.';
    await bluesky.publishText(shortText);

    // Довгий текст для треду
    const longText = `
      Це довгий текст, який демонструє можливості автоматичного створення треду в Bluesky. 
      
      Цей сервіс підтримує:
      ✅ Unicode символи (українські, емодзі тощо)
      ✅ Автоматичне розбиття на частини
      ✅ Створення тредів
      ✅ Збереження контексту відповідей
      
      Коли текст перевищує 300 символів, він автоматично розбивається на кілька постів, 
      які з'єднуються у тред. Це дозволяє публікувати довгі думки без необхідності 
      ручного редагування.
      
      Сервіс намагається розбивати текст по словах, щоб не рвати речення посередині. 
      Це робить читання більш зручним для ваших підписників.
      `;

    await bluesky.publishText(longText.trim());
  } catch (error) {
    console.error('Помилка:', error);
  }
}

void main();
