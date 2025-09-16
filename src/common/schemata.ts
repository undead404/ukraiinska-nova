import type { InferInput } from 'valibot';
import {
  array,
  custom,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  number,
  object,
  picklist,
  pipe,
  string,
  url,
} from 'valibot';

export const dateSchema = pipe(
  string(),
  minLength(4),
  custom(
    (input) => !Number.isNaN(new Date(`${input}`).getTime()),
    'This string is not an ISO date',
  ),
);

export const releaseSchema = object({
  artists: array(pipe(string(), nonEmpty())),
  artistsPopularity: pipe(number(), minValue(0), maxValue(100)),
  imageUrl: pipe(string(), url()),
  releaseDate: dateSchema,
  title: pipe(string(), nonEmpty()),
  totalTracks: pipe(number(), minValue(1)),
  type: picklist(['album', 'compilation', 'single']),
  url: pipe(string(), url()),
});

export type MusicRelease = InferInput<typeof releaseSchema>;

export const enhancedReleaseSchema = object({
  ...releaseSchema.entries,
  tags: array(string()),
});

const appearanceLogEntrySchema = object({
  time: string(),
  type: picklist(['FOUND', 'LOST']),
});

export const releaseRecordSchema = object({
  ...releaseSchema.entries,
  appearanceLog: array(appearanceLogEntrySchema),
});

export type MusicReleaseRecord = InferInput<typeof releaseRecordSchema>;
