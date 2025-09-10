/**
 * Нормалізує дату до формату YYYY-MM-DD
 */
export default function normalizeDate(date: string): string {
  if (date.length === 4) {
    return `${date}-99-99`;
  } else if (date.length === 7) {
    return `${date}-99`;
  }
  return date;
}
