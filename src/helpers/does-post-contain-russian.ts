import type { Post } from 'src/types/index.js';

const RUSSIAN_LETTERS = ['ё', 'Ё', 'ъ', 'Э', 'э', 'ы', 'Ы', 'Ъ'];
function doesTextContainRussianLetters(text: string): boolean {
  return RUSSIAN_LETTERS.some((letter) => text.includes(letter));
}

export default function doesPostContainRussian(post: Post): boolean {
  return doesTextContainRussianLetters(post.text);
}
