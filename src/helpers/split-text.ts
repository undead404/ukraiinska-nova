import getTextLength from './get-text-length.js';

/**
 * Розбиття тексту на частини для треду з урахуванням Unicode
 */
export default function splitTextForThread(
  text: string,
  maxPostLength: number,
): string[] {
  const parts: string[] = [];
  const textArray = Array.from(text);

  let currentPart = '';
  let i = 0;

  while (i < textArray.length) {
    const char = textArray[i];
    const testPart = currentPart + char;

    if (getTextLength(testPart) <= maxPostLength) {
      currentPart = testPart;
      i++;
    } else {
      if (currentPart) {
        // Шукаємо останній пробіл або розділовий знак для розриву
        //   const lastSpaceIndex = currentPart.lastIndexOf(" ");
        const lastNewlineIndex = currentPart.lastIndexOf('\n');
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
