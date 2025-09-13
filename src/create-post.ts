import * as dotenv from 'dotenv';

import savePost from './save-post.js';
import openTodayReleases from './open-today-releases.js';
dotenv.config();

const { date, releases } = await openTodayReleases();

await savePost(date, releases);
