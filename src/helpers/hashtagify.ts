/**
 *
 * @param text Raw tag name
 * @returns Hashtagified tag name
 * @example
 * hashtagify('post-rock') // 'post_rock'
 * hashtagify('Ukrainian') // 'ukrainian'
 * hashtagify('black metal') // 'black_metal'
 */
export default function hashtagify(text: string): string {
  return (
    '#' +
    text
      .toLowerCase()
      .replaceAll(/[\s-]+/g, '_')
      .replaceAll(/[^\w]/g, '')
  );
}
