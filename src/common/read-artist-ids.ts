import { readFile } from 'node:fs/promises';

export default async function readFileArtistIds(
  filePath: string,
): Promise<{ name: string; spotifyId: string; youtubeMusicId: string }[]> {
  const data = await readFile(filePath, 'utf8');
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
        const match = new RegExp(/^"(.+)",([^,]*),([^,]*)$/).exec(line);
        let name: string;
        let spotifyId: string;
        let youtubeMusicId: string;
        if (match) {
          name = match[1];
          spotifyId = match[2];
          youtubeMusicId = match[3];
        } else {
          [name, spotifyId, youtubeMusicId] = line
            .split(',')
            .map((part) => part.trim());
        }

        return { name, spotifyId, youtubeMusicId };
      })
  );
}
