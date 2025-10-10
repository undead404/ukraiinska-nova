import { describe, expect, it } from 'vitest';

import ignoreOldReleases from './ignore-old-releases.js';

type MusicRelease = {
  releaseDate: string;
};

describe('ignoreOldReleases', () => {
  it('filters out releases older than 2022 (year precision)', () => {
    const releases: MusicRelease[] = [
      { releaseDate: '2021' },
      { releaseDate: '2022' },
      { releaseDate: '2023' },
    ];
    const result = ignoreOldReleases(releases);
    expect(result).toEqual([{ releaseDate: '2022' }, { releaseDate: '2023' }]);
  });

  it('filters out releases older than 2022-02 (month precision)', () => {
    const releases: MusicRelease[] = [
      { releaseDate: '2022-01' },
      { releaseDate: '2022-02' },
      { releaseDate: '2022-03' },
    ];
    const result = ignoreOldReleases(releases);
    expect(result).toEqual([
      { releaseDate: '2022-02' },
      { releaseDate: '2022-03' },
    ]);
  });

  it('filters out releases older than 2022-02-24 (day precision)', () => {
    const releases: MusicRelease[] = [
      { releaseDate: '2022-02-23' },
      { releaseDate: '2022-02-24' },
      { releaseDate: '2022-03-01' },
    ];
    const result = ignoreOldReleases(releases);
    expect(result).toEqual([
      { releaseDate: '2022-02-24' },
      { releaseDate: '2022-03-01' },
    ]);
  });

  it('handles mixed precision release dates', () => {
    const releases: MusicRelease[] = [
      { releaseDate: '2021' },
      { releaseDate: '2022-01' },
      { releaseDate: '2022-02' },
      { releaseDate: '2022-02-23' },
      { releaseDate: '2022-02-24' },
      { releaseDate: '2023' },
    ];
    const result = ignoreOldReleases(releases);
    expect(result).toEqual([
      { releaseDate: '2022-02' },
      { releaseDate: '2022-02-24' },
      { releaseDate: '2023' },
    ]);
  });

  it('throws an error for unexpected release date format', () => {
    const releases: MusicRelease[] = [
      { releaseDate: '22' },
      { releaseDate: '2022-2-4' },
      { releaseDate: '' },
    ];
    for (const release of releases) {
      expect(() => ignoreOldReleases([release])).toThrowError(
        `Unexpected release date format: ${release.releaseDate}`,
      );
    }
  });

  it('returns an empty array if all releases are too old', () => {
    const releases: MusicRelease[] = [
      { releaseDate: '2021' },
      { releaseDate: '2021-12' },
      { releaseDate: '2022-01-01' },
    ];
    expect(ignoreOldReleases(releases)).toEqual([]);
  });

  it('returns an empty array if input is empty', () => {
    expect(ignoreOldReleases([])).toEqual([]);
  });
});
