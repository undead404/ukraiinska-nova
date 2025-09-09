import * as dotenv from 'dotenv';
import {
  minLength,
  nonEmpty,
  object,
  optional,
  parse,
  picklist,
  pipe,
  string,
  transform,
} from 'valibot';
// Завантажуємо змінні середовища
dotenv.config();

const environmentSchema = object({
  BLUESKY_IDENTIFIER: pipe(string(), minLength(5)),
  BLUESKY_PASSWORD: pipe(string(), minLength(8)),
  DEBUG: pipe(
    optional(picklist(['true', 'false'])),
    transform((value) => value === 'true' || false),
  ),
  LASTFM_API_KEY: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_ID: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_SECRET: pipe(string(), nonEmpty()),
  TELEGRAM_BOT_TOKEN: pipe(string(), nonEmpty()),
});

const environment = parse(environmentSchema, process.env);

export default environment;
