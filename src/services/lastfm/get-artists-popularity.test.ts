import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import fetchFromLastfm from './fetch-from-lastfm.js';
import { getArtistsPopularity } from './get-artists-popularity.js';

// Mock the fetchFromLastfm dependency
vi.mock('./fetch-from-lastfm.js', () => ({
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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, ['Radiohead']);

      expect(result).toBe(6);
      expect(fetchFromLastfm).toHaveBeenCalledWith(
        {
          method: 'artist.getinfo',
          artist: 'Radiohead',
          api_key: mockApiKey,
        },
        expect.any(Object),
      );
    });

    it('should return maximum popularity from multiple artists', async () => {
      const mockResponses = [
        { artist: { stats: { listeners: 1000 } } }, // log10(1000) = 3
        { artist: { stats: { listeners: 1_000_000 } } }, // log10(1000000) = 6
        { artist: { stats: { listeners: 10_000 } } }, // log10(10000) = 4
      ];

      vi.mocked(fetchFromLastfm)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const result = await getArtistsPopularity(mockApiKey, [
        'Artist1',
        'Artist2',
        'Artist3',
      ]);

      expect(result).toBe(6);
      expect(fetchFromLastfm).toHaveBeenCalledTimes(3);
    });

    it('should handle artist names that need URL encoding', async () => {
      const mockResponse = {
        artist: {
          stats: {
            listeners: 10_000,
          },
        },
      };

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

      await getArtistsPopularity(mockApiKey, ['Artist & Friends']);

      expect(fetchFromLastfm).toHaveBeenCalledWith(
        {
          method: 'artist.getinfo',
          artist: 'Artist & Friends',
          api_key: mockApiKey,
        },
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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

      const firstResult = await getArtistsPopularity(mockApiKey, ['Metallica']);
      expect(firstResult).toBe(6);
      expect(fetchFromLastfm).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      vi.clearAllMocks();
      const secondResult = await getArtistsPopularity(mockApiKey, [
        'Metallica',
      ]);
      expect(secondResult).toBe(6);
      expect(fetchFromLastfm).not.toHaveBeenCalled();
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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

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
      expect(fetchFromLastfm).not.toHaveBeenCalled();
    });

    it('should cache each artist separately', async () => {
      const mockResponses = [
        { artist: { stats: { listeners: 1000 } } }, // popularity = 3
        { artist: { stats: { listeners: 1_000_000 } } }, // popularity = 6
      ];

      vi.mocked(fetchFromLastfm)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      // First call with both artists
      await getArtistsPopularity(mockApiKey, ['Artist7', 'Artist8']);
      expect(fetchFromLastfm).toHaveBeenCalledTimes(2);

      // Second call with just one cached artist
      vi.clearAllMocks();
      const result = await getArtistsPopularity(mockApiKey, ['Artist7']);
      expect(result).toBe(3);
      expect(fetchFromLastfm).not.toHaveBeenCalled();
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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse);

      const result = await getArtistsPopularity(mockApiKey, [
        'Rammstein',
        'Rammstein',
        'Rammstein',
      ]);

      // Should only make one API call due to caching
      expect(result).toBe(6);
      expect(fetchFromLastfm).toHaveBeenCalledTimes(1);
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

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse1);
      await getArtistsPopularity(mockApiKey, ['CachedArtist']);

      // Now test with mixed artists
      const mockResponse2 = {
        artist: {
          stats: {
            listeners: 1_000_000, // popularity = 6
          },
        },
      };

      vi.mocked(fetchFromLastfm).mockResolvedValueOnce(mockResponse2);

      const result = await getArtistsPopularity(mockApiKey, [
        'CachedArtist',
        'NewArtist',
      ]);

      expect(result).toBe(6);
      expect(fetchFromLastfm).toHaveBeenCalledTimes(2); // One from setup, one from test
    });
  });
});
