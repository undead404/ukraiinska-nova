export default function findBestBreakPoint(
  currentPart: string,
  char: string,
): { breakIndex: number; remainingText: string } {
  const breakPoints = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '];
  let bestBreakIndex = -1;
  let bestBreakLength = 0;

  for (const breakPoint of breakPoints) {
    const lastIndex = currentPart.lastIndexOf(breakPoint);
    if (lastIndex > bestBreakIndex && lastIndex > currentPart.length - 100) {
      bestBreakIndex = lastIndex;
      bestBreakLength = breakPoint.length;
      break; // Використовуємо перший знайдений (найкращий)
    }
  }

  if (bestBreakIndex > 0) {
    return {
      breakIndex: Math.max(0, bestBreakIndex + bestBreakLength),
      remainingText:
        currentPart.slice(Math.max(0, bestBreakIndex + bestBreakLength)) + char,
    };
  }

  return {
    breakIndex: currentPart.length,
    remainingText: char,
  };
}
