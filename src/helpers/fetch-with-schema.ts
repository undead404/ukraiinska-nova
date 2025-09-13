import { type BaseIssue, type BaseSchema, parse } from 'valibot';

export default async function fetchWithSchema<T, E extends { message: string }>(
  url: string,
  schema: BaseSchema<unknown, T, BaseIssue<unknown>>,
  errorSchema: BaseSchema<unknown, E, BaseIssue<unknown>>,
): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    try {
      return parse(schema, data);
    } catch {
      const errorData = parse(errorSchema, data);
      throw new Error(errorData.message);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
