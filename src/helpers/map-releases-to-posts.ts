import type { EnhancedMusicRelease, Post } from '../types/index.js';

import hashtagify from './hashtagify.js';
import joinArtists from './join-artists.js';
import translateAlbumType from './translate-album-type.js';

export default function mapReleasesToPosts(releases: EnhancedMusicRelease[]) {
  const posts: Post[] = releases.map((release) => ({
    imageUrl: release.imageUrl,
    links: [
      {
        title: 'SPOTIFY',
        url: release.url,
      },
    ],
    text: `🎤 ${joinArtists(release.artists)}\n💿 ${release.title} (${translateAlbumType(
      release.type,
    )})\n\n${release.tags?.map((tag) => hashtagify(tag)).join(' ')}`,
  }));
  return posts;
}
