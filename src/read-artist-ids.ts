import { readFile } from 'fs/promises';

export default async function readFileArtistIds(
  filePath: string,
): Promise<{ name: string; id: string }[]> {
  const data = await readFile(filePath, 'utf-8');
  // Список артистів з їх Spotify ID
  return (
    data
      // Окремі артисти на різних рядках
      .split('\n')
      .slice(1) // Пропускаємо заголовок
      // Видаляємо зайві пробільні символи
      .map((line) => line.trim())
      // Видаляємо порожні рядки
      .filter((line) => line.length > 0)
      // Розділяємо на ім'я та ID
      .map((line) => {
        // Враховуємо, що назва артиста може містити кому, і тоді вона в подвійних лапках
        const match = line.match(/^"(.+)",(.*)$/);
        let name: string;
        let id: string;
        if (match) {
          name = match[1];
          id = match[2];
        } else {
          [name, id] = line.split(',').map((part) => part.trim());
        }

        if (!id) {
          console.warn(`Порожній ID для артиста: ${name}`);
        }
        return { name, id };
      })
  );
}
