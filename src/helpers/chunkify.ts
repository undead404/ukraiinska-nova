export default function chunkify<T>(collection: T[], chunkSize: number): T[][] {
  const result: T[][] = Array.from({
    length: Math.ceil(collection.length / chunkSize),
  });
  for (let index = 0; index < result.length; index += 1) {
    result[index] = collection.slice(
      index * chunkSize,
      chunkSize * (index + 1),
    );
  }
  return result;
}
