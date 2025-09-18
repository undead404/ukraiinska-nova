import type { MusicReleaseRecord } from '../../common/schemata';

export default function getEarliestReleaseAppearanceTime(
  releases: MusicReleaseRecord[],
): Date | undefined {
  let earliestReleaseAppearanceTime: Date | undefined;
  for (const release of releases) {
    const releaseAppearance = release.appearanceLog.at(0);
    if (!releaseAppearance) {
      throw new Error('empty appearanceLog');
    }
    const releaseAppearanceTime = new Date(releaseAppearance.time);
    if (
      releaseAppearanceTime &&
      (!earliestReleaseAppearanceTime ||
        releaseAppearanceTime.getTime() <
          earliestReleaseAppearanceTime.getTime())
    ) {
      earliestReleaseAppearanceTime = releaseAppearanceTime;
    }
  }
  if (!earliestReleaseAppearanceTime) {
    return;
  }
  return earliestReleaseAppearanceTime;
}
