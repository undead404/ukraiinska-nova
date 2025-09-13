import * as dotenv from 'dotenv';
import { nonEmpty, object, parse, pipe, string } from 'valibot';

dotenv.config();

const environmentSchema = object({
  TELEGRAM_BOT_TOKEN: pipe(string(), nonEmpty()),
});

const environment = parse(environmentSchema, process.env);

export default environment;
