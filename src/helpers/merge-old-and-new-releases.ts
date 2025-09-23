import type { MusicReleaseRecord } from '../common/schemata.js';
import type { EnhancedMusicRelease } from '../types/index.js';

import calculateReleaseIdentity from './calculate-release-identity.js';
import isReleaseRecordObsolete from './is-release-record-obsolete.js';

export default function mergeOldAndNewReleases(
  oldReleases: MusicReleaseRecord[],
  freshReleases: EnhancedMusicRelease[],
): {
  lost: MusicReleaseRecord[];
  new: MusicReleaseRecord[];
  merged: MusicReleaseRecord[];
} {
  const lostReleases: MusicReleaseRecord[] = [];
  const newReleases: MusicReleaseRecord[] = [];
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
    lost: lostReleases,
    new: newReleases,
    merged: mergedReleases,
  };
}
