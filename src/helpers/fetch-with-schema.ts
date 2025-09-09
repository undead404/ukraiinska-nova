import { type BaseIssue, type BaseSchema, parse } from 'valibot';

export default async function fetchWithSchema<T>(
  url: string,
  schema: BaseSchema<unknown, T, BaseIssue<unknown>>,
): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return parse(schema, data);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
