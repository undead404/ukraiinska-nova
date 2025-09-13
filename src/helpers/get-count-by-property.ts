export default function getCountByProperty<T>(
  array: T[],
  property: keyof T,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of array) {
    const key = String(item[property]);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}
