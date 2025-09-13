export default function getTextLength(text: string): number {
  // Використовуємо Array.from для коректного підрахунку Unicode символів
  return [...text].length;
}
