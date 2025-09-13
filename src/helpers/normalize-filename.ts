/**
 *
 * @param filename any string
 * @returns string which is safe as a filename
 */
export default function normalizeFilename(filename: string): string {
  // Remove or replace characters not allowed in filenames across common OSes
  // Windows and Unix safe: disallow <>:"/\\|?* and control chars
  // Also trim whitespace and collapse multiple spaces/dots
  return (
    filename
      // eslint-disable-next-line no-control-regex,sonarjs/no-control-regex
      .replaceAll(/[\u0000-\u001F\u007F<>:"/\\|?*]/g, '') // forbidden chars
      .replaceAll(/[\u{0080}-\u{009F}]/gu, '') // unicode control chars
      .replaceAll(/\s+/g, ' ') // collapse whitespace
      .replaceAll(/\.+/g, '.') // collapse consecutive dots
      // eslint-disable-next-line sonarjs/slow-regex, sonarjs/anchor-precedence
      .replaceAll(/^\s+|\s+$/g, '') // trim leading/trailing whitespace
      // eslint-disable-next-line sonarjs/slow-regex, sonarjs/anchor-precedence
      .replaceAll(/^\.+|\.+$/g, '') // trim leading/trailing dots
      .replace(/^$/, 'untitled') // fallback for empty result
      .slice(0, 255)
  ); // most OSes limit to 255 chars
}
