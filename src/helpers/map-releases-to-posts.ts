import type { EnhancedMusicRelease, Post } from '../types/index.js';

import hashtagify from './hashtagify.js';
import joinArtists from './join-artists.js';
import translateAlbumType from './translate-album-type.js';

const DOMAIN_TO_TITLE = [
  ['open.spotify.com', 'SPOTIFY'],
  ['music.youtube.com', 'YOUTUBE MUSIC'],
];

function getTitleFromUrl(url: string): string {
  for (const [domain, title] of DOMAIN_TO_TITLE) {
    if (url.includes(domain)) {
      return title;
    }
  }
  throw new Error(`Domain unknown: ${url}`);
}

export default function mapReleasesToPosts(releases: EnhancedMusicRelease[]) {
  const posts: Post[] = releases.map((release) => ({
    imageUrl: release.imageUrl,
    links: [
      {
        title: getTitleFromUrl(release.url),
        url: release.url,
      },
    ],
    text: `🎤 ${joinArtists(release.artists)}\n💿 ${release.title} (${translateAlbumType(
      release.type,
    )}, ${release.releaseDate})\n${release.tags?.length ? '\n' : ''}${release.tags?.map((tag) => hashtagify(tag)).join(' ')}`,
  }));
  return posts;
}
