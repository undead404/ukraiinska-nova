import { readFile } from 'node:fs/promises';

export default async function readFileArtists(
  filePath: string,
): Promise<string[]> {
  // Список артистів
  const artists = await readFile(filePath, 'utf8').then((data) =>
    data
      // Окремі артисти на різних рядках
      .split('\n')
      // Видаляємо зайві пробільні символи
      .map((line) => line.trim())
      // Видаляємо порожні рядки
      .filter((line) => line.length > 0)
      // Видаляємо дублікати
      .filter((line, index, self) => self.indexOf(line) === index),
  );
  return artists;
}
