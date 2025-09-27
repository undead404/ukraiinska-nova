import type { MusicReleaseRecord } from '../common/schemata.js';
import type { EnhancedMusicRelease } from '../types/index.js';

import calculateReleaseIdentity from './calculate-release-identity.js';
import isReleaseRecordObsolete from './is-release-record-obsolete.js';

function discriminateByLatestYear(releases: EnhancedMusicRelease[]): {
  new: MusicReleaseRecord[];
  merged: MusicReleaseRecord[];
} {
  const newReleases: MusicReleaseRecord[] = [];
  const mergedReleases: MusicReleaseRecord[] = [];
  const isoTime = new Date().toISOString();
  let latestYear = '0000';
  for (const release of releases) {
    if (release.releaseDate > latestYear) {
      latestYear = release.releaseDate.slice(0, 4);
    }
  }

  for (const release of releases) {
    const newReleaseRecord: MusicReleaseRecord = {
      ...release,
      appearanceLog: [
        {
          time: isoTime,
          type: 'FOUND' as const,
        },
      ],
    };
    if (release.releaseDate.startsWith(latestYear)) {
      console.log(`New release: ${calculateReleaseIdentity(release)}`);
      newReleases.push(newReleaseRecord);
    }
    mergedReleases.push(newReleaseRecord);
  }
  return {
    new: newReleases,
    merged: mergedReleases,
  };
}

function discriminateOldReleaseRecords(
  oldReleases: MusicReleaseRecord[],
  freshReleases: EnhancedMusicRelease[],
): {
  lost: MusicReleaseRecord[];
  merged: MusicReleaseRecord[];
} {
  const lostReleases: MusicReleaseRecord[] = [];
  const mergedReleases: MusicReleaseRecord[] = [];
  const isoTime = new Date().toISOString();
  for (const oldRelease of oldReleases) {
    const oldReleaseIdentity = calculateReleaseIdentity(oldRelease);
    const matchingFreshRelease = freshReleases.find(
      (freshRelease) =>
        calculateReleaseIdentity(freshRelease) === oldReleaseIdentity,
    );
    if (isReleaseRecordObsolete(oldRelease)) {
      if (matchingFreshRelease) {
        mergedReleases.push({
          ...oldRelease,
          appearanceLog: [
            ...oldRelease.appearanceLog,
            {
              time: isoTime,
              type: 'FOUND' as const,
            },
          ],
          artistsPopularity: matchingFreshRelease.artistsPopularity,
        });
      } else {
        mergedReleases.push(oldRelease);
      }
    } else {
      if (matchingFreshRelease) {
        mergedReleases.push(oldRelease);
      } else {
        const lostRelease = {
          ...oldRelease,
          appearanceLog: [
            ...oldRelease.appearanceLog,
            {
              time: isoTime,
              type: 'LOST' as const,
            },
          ],
        };
        console.log(`Lost release: ${calculateReleaseIdentity(oldRelease)}`);
        lostReleases.push(lostRelease);
        mergedReleases.push(lostRelease);
      }
    }
  }
  return {
    lost: lostReleases,
    merged: mergedReleases,
  };
}

function discriminateFreshReleases(
  oldReleases: MusicReleaseRecord[],
  freshReleases: EnhancedMusicRelease[],
) {
  const newReleases: MusicReleaseRecord[] = [];
  const mergedReleases: MusicReleaseRecord[] = [];
  const isoTime = new Date().toISOString();
  for (const freshRelease of freshReleases) {
    const freshReleaseIdentity = calculateReleaseIdentity(freshRelease);
    const matchingOldRelease = oldReleases.find(
      (oldRelease) =>
        calculateReleaseIdentity(oldRelease) === freshReleaseIdentity,
    );
    if (!matchingOldRelease) {
      const newReleaseRecord: MusicReleaseRecord = {
        ...freshRelease,
        appearanceLog: [
          {
            time: isoTime,
            type: 'FOUND' as const,
          },
        ],
      };
      console.log(`New release: ${calculateReleaseIdentity(freshRelease)}`);
      newReleases.push(newReleaseRecord);
      mergedReleases.push(newReleaseRecord);
    }
  }
  return {
    new: newReleases,
    merged: mergedReleases,
  };
}

export default function mergeOldAndNewReleases(
  oldReleases: MusicReleaseRecord[],
  freshReleases: EnhancedMusicRelease[],
): {
  lost: MusicReleaseRecord[];
  new: MusicReleaseRecord[];
  merged: MusicReleaseRecord[];
} {
  if (oldReleases.length === 0) {
    // This can mean Youtube Music API suddenly remembered about this artist.
    // Return only latest year's releases as fresh
    return { ...discriminateByLatestYear(freshReleases), lost: [] };
  }
  const { lost: lostRecords, merged: mergedOldRecords } =
    discriminateOldReleaseRecords(oldReleases, freshReleases);
  const { new: newRecords, merged: mergedNewRecords } =
    discriminateFreshReleases(oldReleases, freshReleases);

  return {
    lost: lostRecords,
    new: newRecords,
    merged: [...mergedOldRecords, ...mergedNewRecords],
  };
}
