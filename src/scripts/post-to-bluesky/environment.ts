import * as dotenv from 'dotenv';
import { minLength, object, parse, pipe, string } from 'valibot';

dotenv.config();

const environmentSchema = object({
  BLUESKY_IDENTIFIER: pipe(string(), minLength(5)),
  BLUESKY_PASSWORD: pipe(string(), minLength(8)),
});

const environment = parse(environmentSchema, process.env);

export default environment;
