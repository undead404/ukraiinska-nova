import * as dotenv from 'dotenv';
import { minLength, nonEmpty, object, parse, pipe, string } from 'valibot';

dotenv.config();

const environmentSchema = object({
  BLUESKY_IDENTIFIER_FOR_YOUTUBE_MUSIC: pipe(string(), minLength(5)),
  BLUESKY_PASSWORD_FOR_YOUTUBE_MUSIC: pipe(string(), minLength(8)),
  LASTFM_API_KEY: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_ID: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_SECRET: pipe(string(), nonEmpty()),
  TELEGRAM_BOT_TOKEN: pipe(string(), nonEmpty()),
  TELEGRAM_CHANNEL_FOR_YOUTUBE_MUSIC: pipe(string(), nonEmpty()),
});

const environment = parse(environmentSchema, process.env);

export default environment;
