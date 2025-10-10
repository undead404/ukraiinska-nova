const MIN_YEAR = '2022';

const MIN_MONTH = '2022-02';
const MIN_DAY = '2022-02-24';

export default function ignoreOldReleases<T extends { releaseDate: string }>(
  releases: T[],
): T[] {
  return releases.filter((release) => {
    switch (release.releaseDate.length) {
      case 4: {
        return release.releaseDate >= MIN_YEAR;
      }
      case 7: {
        return release.releaseDate >= MIN_MONTH;
      }
      case 10: {
        return release.releaseDate >= MIN_DAY;
      }
      // No default
    }
    throw new Error(`Unexpected release date format: ${release.releaseDate}`);
  });
}
