import type { ScrapingOptions } from '../types';

import isDateInRange from './is-date-in-range';
import normalizeDate from './normalize-date';

export default function filterAlbums(
  albums: SpotifyApi.AlbumObjectSimplified[],
  options: ScrapingOptions,
) {
  const albumTypes = ['album', 'single'];
  if (options.includeCompilations) {
    albumTypes.push('compilation');
  }
  if (options.includeAppears) {
    albumTypes.push('appears_on');
  }
  return albums
    .filter((album) => albumTypes.includes(album.album_type))
    .filter((album) => {
      const releaseDate = normalizeDate(album.release_date);
      return isDateInRange(releaseDate, options.startDate, options.endDate);
    });
}
