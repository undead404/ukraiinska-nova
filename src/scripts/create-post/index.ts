import enhanceReleases from '../../common/enhance-releases.js';
import convertAsyncGeneratorToArray from '../../helpers/convert-async-generator-to-array.js';

import environment from './environment.js';
import getTodayReleases from './get-today-releases.js';
import savePost from './save-post.js';

const releases = await convertAsyncGeneratorToArray(getTodayReleases());

const enhancedReleases = await convertAsyncGeneratorToArray(
  enhanceReleases(environment.LASTFM_API_KEY, releases),
);

const today = new Date().toISOString().slice(0, 10);

await savePost(today, enhancedReleases);
