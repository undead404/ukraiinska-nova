import * as dotenv from 'dotenv';

import hashtagify from './helpers/hashtagify.js';
import joinArtists from './helpers/join-artists';
import translatePopularity from './helpers/translate-popularity';
import openTodayReleases from './open-today-releases.js';
import { BlueskyService } from './services/bluesky.js';
import { minLength, object, parse, pipe, string } from 'valibot';
import translateAlbumType from './helpers/translate-album-type.js';
dotenv.config();

const environmentSchema = object({
  BLUESKY_IDENTIFIER: pipe(string(), minLength(5)),
  BLUESKY_PASSWORD: pipe(string(), minLength(8)),
});

const environment = parse(environmentSchema, process.env);

const { releases } = await openTodayReleases();

const posts: Array<{
  imageUrl?: string;
  links?: Array<{ title: string; url: string }>;
  text: string;
}> =
  releases.length === 0
    ? [
        {
          text: `🚀 Сьогодні нових релізів немає! 🚀\nЗалишайтеся з нами, поки продовжуючи слухати класику! 🎵🇺🇦`,
        },
      ]
    : releases.map((release) => ({
        imageUrl: release.imageUrl,
        links: [
          {
            title: 'SPOTIFY',
            url: release.url,
          },
        ],
        text: `${translatePopularity(release.artistsPopularity)}🎤 ${joinArtists(release.artists)}\n💿 ${release.title} (${translateAlbumType(
          release.type,
        )})\n\n${release.tags?.map((tag) => `#${hashtagify(tag)}`).join(' ')}`,
      }));

const bluesky = new BlueskyService({
  service: 'https://bsky.social',
  identifier: environment.BLUESKY_IDENTIFIER, // або email
  password: environment.BLUESKY_PASSWORD, // використовуйте App Password, не основний пароль!
});

await bluesky.login();
console.log('\n🚀 Публікація у Bluesky...');

let rootPost: { uri: string; cid: string } | undefined = undefined;
let previousPost: { uri: string; cid: string } | undefined = undefined;

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
