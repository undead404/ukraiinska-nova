import { createHash } from 'node:crypto';

export function getGroupNumber(
  objectId: string | number,
  numberGroups: number = 24,
): number {
  const idString = String(objectId);
  // eslint-disable-next-line sonarjs/hashing
  const hash = createHash('md5').update(idString).digest('hex');

  // Convert first 8 characters of hex to integer
  const hashInt = Number.parseInt(hash.slice(0, 8), 16);

  return hashInt % numberGroups;
}

export default function* chooseArtists<T extends { id: string }>(artists: T[]) {
  const currentHour = new Date().getUTCHours();
  for (const artist of artists) {
    const groupNumber = getGroupNumber(artist.id);
    if (groupNumber === currentHour) {
      yield artist;
    }
  }
}
