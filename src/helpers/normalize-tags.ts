import isTagBlacklisted from './is-tag-blacklisted.js';

export default function normalizeTags(
  tags: { count: number; name: string }[],
): { count: number; name: string }[] {
  const allowedTags = tags.filter(
    (tag) => !isTagBlacklisted(tag.name.toLowerCase()),
  );
  const maxWeight = Math.max(...allowedTags.map((tag) => tag.count));
  const multiplier = 100 / maxWeight;
  return allowedTags.map((tag) => ({
    ...tag,
    count: tag.count * multiplier,
  }));
}
