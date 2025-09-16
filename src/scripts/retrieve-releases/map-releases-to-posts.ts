import hashtagify from '../../helpers/hashtagify.js';
import joinArtists from '../../helpers/join-artists.js';
import translateAlbumType from '../../helpers/translate-album-type.js';
import translatePopularity from '../../helpers/translate-popularity.js';
import type { EnhancedMusicRelease } from '../../types/index.js';

export default function mapReleasesToPosts(releases: EnhancedMusicRelease[]) {
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
          )})\n\n${release.tags?.map((tag) => hashtagify(tag)).join(' ')}`,
        }));
  return posts;
}
