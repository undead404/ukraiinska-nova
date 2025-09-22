import { BlueskyService } from '../services/bluesky.js';
import type { Post } from '../types/index.js';

export default async function postToBluesky(
  blueskyIdentifier: string,
  blueskyPassword: string,
  posts: Post[],
) {
  const bluesky = new BlueskyService({
    service: 'https://bsky.social',
    identifier: blueskyIdentifier, // або email
    password: blueskyPassword, // використовуйте App Password, не основний пароль!
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
          ? '\n\n' + post.links.map((link) => link.url).join('\n')
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
}
