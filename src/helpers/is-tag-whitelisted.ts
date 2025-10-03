import { readFile } from 'node:fs/promises';

const blacklistedTagsData = await readFile('./whitelisted-tags.txt');

const WHITELISTED_TAGS = blacklistedTagsData.toString().split('\n');

export default function isTagWhitelisted(tagName: string): boolean {
  return WHITELISTED_TAGS.includes(tagName);
}
