import type { MusicReleaseRecord } from '../common/schemata.js';

export default function isReleaseRecordObsolete(
  releaseRecord: MusicReleaseRecord,
) {
  if (releaseRecord.appearanceLog.length === 0) {
    throw new Error('appearance log is empty');
  }
  return releaseRecord.appearanceLog.at(-1)!.type === 'LOST';
}
