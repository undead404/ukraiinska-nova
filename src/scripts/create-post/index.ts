import openTodayReleases from '../../open-today-releases.js';

import savePost from './save-post.js';

const { date, releases } = await openTodayReleases();

await savePost(date, releases);
