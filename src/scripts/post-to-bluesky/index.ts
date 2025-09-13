import openTodayReleases from '../../open-today-releases.js';
import { BlueskyService } from '../../services/bluesky.js';

import environment from './environment.js';
import mapReleasesToPosts from './map-releases-to-posts.js';

const { releases } = await openTodayReleases();

const posts = mapReleasesToPosts(releases);

const bluesky = new BlueskyService({
  service: 'https://bsky.social',
  identifier: environment.BLUESKY_IDENTIFIER, // або email
  password: environment.BLUESKY_PASSWORD, // використовуйте App Password, не основний пароль!
});

await bluesky.login();
console.log('\n🚀 Публікація у Bluesky...');

let rootPost: { uri: string; cid: string } | undefined;
let previousPost: { uri: string; cid: string } | undefined;

for (const post of posts) {
  const { posts: publishedPosts } = await bluesky.publishText(
    post.text +
      // add links if any
      (post.links && post.links.length > 0
        ? '\n' +
          post.links.map((link) => `${link.title}: ${link.url}`).join('\n')
        : ''),
    rootPost && previousPost
      ? { root: rootPost, parent: previousPost }
      : undefined,
    post.imageUrl
      ? { imageUrl: post.imageUrl, altText: 'Обкладинка релізу' }
      : undefined,
  );
  previousPost = publishedPosts.at(-1);
  if (!rootPost) {
    rootPost = previousPost;
  }
}
