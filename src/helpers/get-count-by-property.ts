export default function getCountByProperty<T>(
  array: T[],
  property: keyof T,
): Record<string, number> {
  return array.reduce(
    (acc, item) => {
      const key = String(item[property]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}
