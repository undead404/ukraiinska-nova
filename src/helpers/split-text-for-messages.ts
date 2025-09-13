import findBestBreakPoint from './find-best-break-point';
import getTextLength from './get-text-length';

export default function splitTextForMessages(
  text: string,
  maxLength: number,
): string[] {
  const parts: string[] = [];
  const textArray = [...text];

  let currentPart = '';
  let index = 0;

  while (index < textArray.length) {
    const char = textArray[index];
    const testPart = currentPart + char;

    if (getTextLength(testPart) <= maxLength) {
      currentPart = testPart;
      index++;
    } else {
      if (currentPart) {
        const { breakIndex, remainingText } = findBestBreakPoint(
          currentPart,
          char,
        );
        parts.push(currentPart.slice(0, breakIndex).trim());
        currentPart = remainingText;
      } else {
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
