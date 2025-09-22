import type { BaseIssue, BaseSchema } from 'valibot';

import fetchWithSchema from '../../helpers/fetch-with-schema.js';

import { errorResponseSchema } from './schemata.js';

const DEFAULT_PARAMETERS = {
  format: 'json',
};

const NOT_FOUND_MESSAGE = 'The artist you supplied could not be found';

export default async function fetchFromLastfm<T>(
  parameters: Record<string, string>,
  schema: BaseSchema<unknown, T, BaseIssue<unknown>>,
): Promise<T | undefined> {
  const stringifiedParameters = new URLSearchParams({
    ...DEFAULT_PARAMETERS,
    ...parameters,
  });
  try {
    return await fetchWithSchema(
      `https://ws.audioscrobbler.com/2.0/?${stringifiedParameters}`,
      schema,
      errorResponseSchema,
    );
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes(NOT_FOUND_MESSAGE)
    ) {
      return;
    }
    throw error;
  }
}
