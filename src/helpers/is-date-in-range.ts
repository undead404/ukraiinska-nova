/**
 * Перевіряє, чи знаходиться дата у вказаному діапазоні
 */
export default function isDateInRange(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  return date >= startDate && date <= endDate;
}
