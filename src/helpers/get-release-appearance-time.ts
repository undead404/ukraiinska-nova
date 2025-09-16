import type { MusicReleaseRecord } from '../common/schemata.js';

export default function getReleaseAppearanceTime(
  release: MusicReleaseRecord,
): Date | undefined {
  const lastLogRecord = release.appearanceLog.at(-1);
  if (lastLogRecord!.type !== 'FOUND') {
    return;
  }
  return new Date(lastLogRecord!.time);
}
