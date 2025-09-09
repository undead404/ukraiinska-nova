const ORDINARY_SEPARATOR = ", ";
const FINAL_SEPARATOR = " і ";

export default function joinArtists(artists: string[]): string {
  if (artists.length === 0) {
    throw new Error("Масив артистів порожній");
  }
  if (artists.length === 1) {
    return artists[0];
  }
  if (artists.length === 2) {
    return artists.join(FINAL_SEPARATOR);
  }
  const allButLast = artists.slice(0, -1).join(ORDINARY_SEPARATOR);
  const last = artists[artists.length - 1];
  return `${allButLast}${FINAL_SEPARATOR}${last}`;
}
