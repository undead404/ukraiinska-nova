import {
  array,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  number,
  object,
  pipe,
  string,
  transform,
} from 'valibot';

export const errorResponseSchema = object({
  error: number(),
  message: pipe(string(), nonEmpty()),
});

export const toptagsResponseSchema = object({
  toptags: object({
    tag: array(
      object({
        count: pipe(number(), minValue(1), maxValue(100)),
        name: pipe(string(), minLength(1)),
      }),
    ),
  }),
});

export const infoResponseSchema = object({
  artist: object({
    name: pipe(string(), nonEmpty()),
    stats: object({
      listeners: pipe(
        string(),
        transform((input) => Number.parseInt(input)),
      ),
    }),
  }),
});
