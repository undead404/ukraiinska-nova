export default async function convertAsyncGeneratorToArray<T>(
  asyncGenerator: AsyncGenerator<T, void, unknown>,
): Promise<T[]> {
  const array: T[] = [];
  for await (const value of asyncGenerator) {
    array.push(value);
  }
  return array;
}
