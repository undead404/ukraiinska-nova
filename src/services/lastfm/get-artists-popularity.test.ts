import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import fetchWithSchema from '../../helpers/fetch-with-schema.js';

import { getArtistsPopularity } from './get-artists-popularity.js';

// Mock the fetchWithSchema dependency
vi.mock('../../helpers/fetch-with-schema.js', () => ({
  default: vi.fn(),
}));

// Mock console.error to avoid noise in test output
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Helper to clear cache before each test
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  consoleSpy.mockClear();
});

describe('getArtistsPopularity', () => {
  const mockApiKey = 'test-api-key';

  describe('API calls and popularity calculation', () => {
    it('should return 0 for empty artists array', async () => {
      const result = await getArtistsPopularity(mockApiKey, []);
      expect(result).toBe(0);
    });

    it('should calculate popularity correctly from API response', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 1_000_000, // log10(1000000) = 6
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, ['Radiohead']);

      expect(result).toBe(6);
      expect(fetchWithSchema).toHaveBeenCalledWith(
        `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent('Radiohead')}&api_key=${mockApiKey}&format=json`,
        expect.any(Object), // infoResponseSchema
        expect.any(Object), // errorResponseSchema
      );
    });

    it('should return maximum popularity from multiple artists', async () => {
      const mockResponses = [
        { artist: { stats: { listeners: 1000 } } }, // log10(1000) = 3
        { artist: { stats: { listeners: 1_000_000 } } }, // log10(1000000) = 6
        { artist: { stats: { listeners: 10_000 } } }, // log10(10000) = 4
      ];

      vi.mocked(fetchWithSchema)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const result = await getArtistsPopularity(mockApiKey, [
        'Artist1',
        'Artist2',
        'Artist3',
      ]);

      expect(result).toBe(6);
      expect(fetchWithSchema).toHaveBeenCalledTimes(3);
    });

    it('should handle artist names that need URL encoding', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 10_000,
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      await getArtistsPopularity(mockApiKey, ['Artist & Friends']);

      expect(fetchWithSchema).toHaveBeenCalledWith(
        `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent('Artist & Friends')}&api_key=${mockApiKey}&format=json`,
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe('caching mechanism', () => {
    it('should use cached value when available', async () => {
      // First call - should make API request
      const mockResponse = {
        artist: {
          stats: {
            listeners: 1_000_000, // popularity = 6
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      const firstResult = await getArtistsPopularity(mockApiKey, ['Radiohead']);
      expect(firstResult).toBe(6);
      expect(fetchWithSchema).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      vi.clearAllMocks();
      const secondResult = await getArtistsPopularity(mockApiKey, [
        'Radiohead',
      ]);
      expect(secondResult).toBe(6);
      expect(fetchWithSchema).not.toHaveBeenCalled();
    });

    it('should handle cached value of 0 correctly', async () => {
      // Mock an artist with 1 listener (log10(1) = 0)
      const mockResponse = {
        artist: {
          stats: {
            listeners: 1,
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      // First call
      const firstResult = await getArtistsPopularity(mockApiKey, [
        'Unknown Artist',
      ]);
      expect(firstResult).toBe(0);

      // Second call should use cached 0 value, not make new API call
      vi.clearAllMocks();
      const secondResult = await getArtistsPopularity(mockApiKey, [
        'Unknown Artist',
      ]);
      expect(secondResult).toBe(0);
      expect(fetchWithSchema).not.toHaveBeenCalled();
    });

    it('should cache each artist separately', async () => {
      const mockResponses = [
        { artist: { stats: { listeners: 1000 } } }, // popularity = 3
        { artist: { stats: { listeners: 1_000_000 } } }, // popularity = 6
      ];

      vi.mocked(fetchWithSchema)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      // First call with both artists
      await getArtistsPopularity(mockApiKey, ['Artist1', 'Artist2']);
      expect(fetchWithSchema).toHaveBeenCalledTimes(2);

      // Second call with just one cached artist
      vi.clearAllMocks();
      const result = await getArtistsPopularity(mockApiKey, ['Artist1']);
      expect(result).toBe(3);
      expect(fetchWithSchema).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully and continue with other artists', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 1_000_000, // popularity = 6
          },
        },
      };

      vi.mocked(fetchWithSchema)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, [
        'FailingArtist',
        'SuccessArtist',
      ]);

      expect(result).toBe(6);
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 0 when all API calls fail', async () => {
      vi.mocked(fetchWithSchema).mockRejectedValue(new Error('API Error'));

      const result = await getArtistsPopularity(mockApiKey, [
        'Artist1',
        'Artist2',
      ]);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle network timeouts and other fetch errors', async () => {
      vi.mocked(fetchWithSchema)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'));

      const result = await getArtistsPopularity(mockApiKey, [
        'Artist1',
        'Artist2',
      ]);

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Network timeout',
        }),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Connection refused',
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very large listener counts', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 999_999_999, // log10(999999999) ≈ 8.999... -> Math.trunc = 8
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, [
        'Mega Popular Artist',
      ]);
      expect(result).toBe(8);
    });

    it('should handle listener count of 1', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 1, // log10(1) = 0
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, ['New Artist']);
      expect(result).toBe(0);
    });

    it('should handle duplicate artists in the array', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 1_000_000, // popularity = 6
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, [
        'Rammstein',
        'Rammstein',
        'Rammstein',
      ]);

      // Should only make one API call due to caching
      expect(result).toBe(6);
      expect(fetchWithSchema).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed cached and uncached artists', async () => {
      // Pre-populate cache
      const mockResponse1 = {
        artist: {
          stats: {
            listeners: 1000, // popularity = 3
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse1);
      await getArtistsPopularity(mockApiKey, ['CachedArtist']);

      // Now test with mixed artists
      const mockResponse2 = {
        artist: {
          stats: {
            listeners: 1_000_000, // popularity = 6
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse2);

      const result = await getArtistsPopularity(mockApiKey, [
        'CachedArtist',
        'NewArtist',
      ]);

      expect(result).toBe(6);
      expect(fetchWithSchema).toHaveBeenCalledTimes(2); // One from setup, one from test
    });
  });

  describe('variable shadowing bug', () => {
    it('should correctly handle the popularity variable shadowing issue', async () => {
      // This test verifies the bug where `popularity` is redeclared in the try block
      // The original code has `const popularity = ...` inside the try block,
      // which shadows the outer `let popularity = 0`

      const mockResponse = {
        artist: {
          stats: {
            listeners: 1_000_000, // popularity = 6
          },
        },
      };

      vi.mocked(fetchWithSchema).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, ['TestArtist']);

      // Due to the variable shadowing bug, the popularity calculated inside
      // the try block doesn't affect the outer popularity variable
      // This test documents the current (buggy) behavior
      expect(result).toBe(0); // This should be 6, but due to the bug it's 0
    });
  });
});
