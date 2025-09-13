import getTextLength from './get-text-length.js';

/**
 * Розбиття тексту на частини для треду з урахуванням Unicode
 */
export default function splitTextForThread(
  text: string,
  maxPostLength: number,
): string[] {
  const parts: string[] = [];
  const textArray = [...text];

  let currentPart = '';
  let index = 0;

  while (index < textArray.length) {
    const char = textArray[index];
    const testPart = currentPart + char;

    if (getTextLength(testPart) <= maxPostLength) {
      currentPart = testPart;
      index++;
    } else {
      if (currentPart) {
        // Шукаємо останній пробіл або розділовий знак для розриву
        //   const lastSpaceIndex = currentPart.lastIndexOf(" ");
        const lastNewlineIndex = currentPart.lastIndexOf('\n');
        const breakIndex = lastNewlineIndex;

        if (breakIndex > 0 && breakIndex > currentPart.length - 50) {
          // Розриваємо по пробілу/новому рядку
          parts.push(currentPart.slice(0, Math.max(0, breakIndex)).trim());
          currentPart = currentPart.slice(Math.max(0, breakIndex + 1)) + char;
        } else {
          // Розриваємо примусово
          parts.push(currentPart.trim());
          currentPart = char;
        }
      } else {
        // Якщо навіть один символ не поміщається (не повинно трапитися)
        currentPart = char;
      }
      index++;
    }
  }

  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts.filter((part) => part.length > 0);
}
