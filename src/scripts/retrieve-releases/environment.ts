import * as dotenv from 'dotenv';
import { nonEmpty, object, parse, pipe, string } from 'valibot';

dotenv.config();

const environmentSchema = object({
  LASTFM_API_KEY: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_ID: pipe(string(), nonEmpty()),
  SPOTIFY_CLIENT_SECRET: pipe(string(), nonEmpty()),
});

const environment = parse(environmentSchema, process.env);

export default environment;
