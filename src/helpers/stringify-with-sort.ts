/**
 * Options for stable JSON stringify
 */
export interface StableStringifyOptions {
  /** Number of spaces for indentation (default: undefined for compact output) */
  space?: string | number;
  /** Custom replacer function (applied before key sorting) */
  replacer?: (key: string, value: unknown) => unknown;
}

/**
 * Alternative implementation using JSON.stringify's replacer parameter
 * This version is more memory efficient for large objects
 */
export default function stringifyWithSort(
  value: unknown,
  options: StableStringifyOptions = {},
): string {
  const { space, replacer } = options;

  const sortingReplacer = (key: string, value_: unknown) => {
    // Apply custom replacer first if provided
    const processedValue = replacer ? replacer(key, value_) : value_;

    // Sort object keys
    if (
      processedValue &&
      typeof processedValue === 'object' &&
      !Array.isArray(processedValue)
    ) {
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(processedValue);
      keys.sort((a, b) => a.localeCompare(b));
      for (const k of keys) {
        sorted[k] = (processedValue as Record<string, unknown>)[k];
      }
      return sorted;
    }

    return processedValue;
  };

  return JSON.stringify(value, sortingReplacer, space);
}
