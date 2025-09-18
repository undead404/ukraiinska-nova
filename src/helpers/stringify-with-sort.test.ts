import { describe, expect, it } from 'vitest';

import stringifyWithSort from './stringify-with-sort';

describe('stringifyWithSort', () => {
  describe('basic functionality', () => {
    it('should stringify simple values', () => {
      expect(stringifyWithSort(null)).toBe('null');
      expect(stringifyWithSort(undefined)).toBe(undefined);
      expect(stringifyWithSort(true)).toBe('true');
      expect(stringifyWithSort(false)).toBe('false');
      expect(stringifyWithSort(42)).toBe('42');
      expect(stringifyWithSort('hello')).toBe('"hello"');
    });

    it('should stringify arrays without sorting', () => {
      const array = [3, 1, 2];
      expect(stringifyWithSort(array)).toBe('[3,1,2]');
    });

    it('should stringify empty objects and arrays', () => {
      expect(stringifyWithSort({})).toBe('{}');
      expect(stringifyWithSort([])).toBe('[]');
    });
  });

  describe('key sorting', () => {
    it('should sort object keys alphabetically', () => {
      const object = { z: 1, a: 2, m: 3 };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"m":3,"z":1}');
    });

    it('should sort nested object keys', () => {
      const object = {
        z: { y: 1, x: 2 },
        a: { c: 3, b: 4 },
      };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":{"b":4,"c":3},"z":{"x":2,"y":1}}');
    });

    it('should handle mixed types in objects', () => {
      const object = {
        z: 'string',
        a: 42,
        m: true,
        b: null,
        x: [1, 2, 3],
      };
      const result = stringifyWithSort(object);
      expect(result).toBe(
        '{"a":42,"b":null,"m":true,"x":[1,2,3],"z":"string"}',
      );
    });

    it('should sort keys using localeCompare', () => {
      const object = { Z: 1, a: 2, A: 3, z: 4 };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"A":3,"z":4,"Z":1}');
    });
  });

  describe('spacing options', () => {
    it('should format with number space', () => {
      const object = { b: 1, a: 2 };
      const result = stringifyWithSort(object, { space: 2 });
      expect(result).toBe('{\n  "a": 2,\n  "b": 1\n}');
    });

    it('should format with string space', () => {
      const object = { b: 1, a: 2 };
      const result = stringifyWithSort(object, { space: '\t' });
      expect(result).toBe('{\n\t"a": 2,\n\t"b": 1\n}');
    });

    it('should format nested objects with spacing', () => {
      const object = { z: { b: 1, a: 2 }, a: 3 };
      const result = stringifyWithSort(object, { space: 2 });
      expect(result).toBe(
        '{\n  "a": 3,\n  "z": {\n    "a": 2,\n    "b": 1\n  }\n}',
      );
    });
  });

  describe('custom replacer', () => {
    it('should apply custom replacer before sorting', () => {
      const object = { b: 1, a: 2, c: 3 };
      const replacer = (key: string, value: unknown) => {
        if (typeof value === 'number') {
          return value * 2;
        }
        return value;
      };
      const result = stringifyWithSort(object, { replacer });
      expect(result).toBe('{"a":4,"b":2,"c":6}');
    });

    it('should handle replacer that filters keys', () => {
      const object = { password: 'secret', username: 'john', id: 123 };
      const replacer = (key: string, value: unknown) => {
        if (key === 'password') {
          return;
        }
        return value;
      };
      const result = stringifyWithSort(object, { replacer });
      expect(result).toBe('{"id":123,"username":"john"}');
    });

    it('should apply replacer to nested objects', () => {
      const object = {
        user: { name: 'john', age: 30 },
        settings: { theme: 'dark', notifications: true },
      };
      const replacer = (key: string, value: unknown) => {
        if (key === 'age' && typeof value === 'number') {
          return value + 1; // increment age
        }
        return value;
      };
      const result = stringifyWithSort(object, { replacer });
      expect(result).toBe(
        '{"settings":{"notifications":true,"theme":"dark"},"user":{"age":31,"name":"john"}}',
      );
    });

    it('should work with both replacer and space options', () => {
      const object = { b: 2, a: 1 };
      const replacer = (key: string, value: unknown) => {
        if (typeof value === 'number') {
          return value * 10;
        }
        return value;
      };
      const result = stringifyWithSort(object, { replacer, space: 2 });
      expect(result).toBe('{\n  "a": 10,\n  "b": 20\n}');
    });
  });

  describe('edge cases', () => {
    it('should handle objects with non-enumerable properties', () => {
      const object = { b: 1, a: 2 };
      Object.defineProperty(object, 'hidden', {
        value: 'secret',
        enumerable: false,
      });
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"b":1}');
    });

    it('should handle objects with symbol keys', () => {
      const sym = Symbol('test');
      const object = { b: 1, a: 2, [sym]: 'symbol' };
      const result = stringifyWithSort(object);
      // JSON.stringify ignores symbol keys
      expect(result).toBe('{"a":2,"b":1}');
    });

    it('should handle circular references gracefully', () => {
      const object: any = { b: 1, a: 2 };
      object.circular = object;

      expect(() => stringifyWithSort(object)).toThrow();
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const object = { date, b: 1, a: 2 };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"b":1,"date":"2023-01-01T00:00:00.000Z"}');
    });

    it('should handle RegExp objects', () => {
      const regex = /test/gi;
      const object = { regex, b: 1, a: 2 };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"b":1,"regex":{}}');
    });

    it('should handle functions (which get omitted)', () => {
      const object = {
        fn: () => 'test',
        b: 1,
        a: 2,
      };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"b":1}');
    });

    it('should handle very deeply nested objects', () => {
      const deep = {
        level1: {
          level2: {
            level3: {
              d: 4,
              c: 3,
              b: 2,
              a: 1,
            },
          },
        },
      };
      const result = stringifyWithSort(deep);
      expect(result).toBe(
        '{"level1":{"level2":{"level3":{"a":1,"b":2,"c":3,"d":4}}}}',
      );
    });
  });

  describe('type consistency', () => {
    it('should maintain consistent output for same input', () => {
      const object = { c: 3, a: 1, b: 2 };
      const result1 = stringifyWithSort(object);
      const result2 = stringifyWithSort(object);
      expect(result1).toBe(result2);
      expect(result1).toBe('{"a":1,"b":2,"c":3}');
    });

    it('should produce different results for objects with different key orders', () => {
      const object1 = { a: 1, b: 2, c: 3 };
      const object2 = { c: 3, b: 2, a: 1 };
      const result1 = stringifyWithSort(object1);
      const result2 = stringifyWithSort(object2);
      // Both should produce the same result due to sorting
      expect(result1).toBe(result2);
      expect(result1).toBe('{"a":1,"b":2,"c":3}');
    });
  });

  describe('options parameter', () => {
    it('should work with empty options object', () => {
      const object = { b: 1, a: 2 };
      const result = stringifyWithSort(object, {});
      expect(result).toBe('{"a":2,"b":1}');
    });

    it('should work with no options parameter', () => {
      const object = { b: 1, a: 2 };
      const result = stringifyWithSort(object);
      expect(result).toBe('{"a":2,"b":1}');
    });

    it('should handle partial options', () => {
      const object = { b: 1, a: 2 };

      const resultWithSpace = stringifyWithSort(object, { space: 2 });
      expect(resultWithSpace).toBe('{\n  "a": 2,\n  "b": 1\n}');

      const resultWithReplacer = stringifyWithSort(object, {
        replacer: (k, v) => (typeof v === 'number' ? v * 2 : v),
      });
      expect(resultWithReplacer).toBe('{"a":4,"b":2}');
    });
  });
});
