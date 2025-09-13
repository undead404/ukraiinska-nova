import { readFile } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import readFileArtists from './read-artists';

// Helper for mock restore
const originalReadFile = readFile;

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('readFileArtists', () => {
  const mockReadFile = readFile as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // restore if required in other test suites
    (readFile as any) = originalReadFile;
  });

  it('returns an array of artist names from a file with one artist per line', async () => {
    mockReadFile.mockResolvedValue('Artist 1\nArtist 2\nArtist 3');
    const result = await readFileArtists('mock/path/artists.txt');
    expect(result).toEqual(['Artist 1', 'Artist 2', 'Artist 3']);
    expect(mockReadFile).toHaveBeenCalledWith('mock/path/artists.txt', 'utf8');
  });

  it('trims whitespace around each artist name', async () => {
    mockReadFile.mockResolvedValue('  Artist 1  \n\tArtist 2\t\nArtist 3\n');
    const result = await readFileArtists('mock/path/artists.txt');
    expect(result).toEqual(['Artist 1', 'Artist 2', 'Artist 3']);
  });

  it('filters out empty lines', async () => {
    mockReadFile.mockResolvedValue('Artist 1\n\n\nArtist 2\n\n');
    const result = await readFileArtists('mock/path/artists.txt');
    expect(result).toEqual(['Artist 1', 'Artist 2']);
  });

  it('removes duplicate artist names', async () => {
    mockReadFile.mockResolvedValue(
      'Artist 1\nArtist 2\nArtist 1\nArtist 3\nArtist 2',
    );
    const result = await readFileArtists('mock/path/artists.txt');
    expect(result).toEqual(['Artist 1', 'Artist 2', 'Artist 3']);
  });

  it('returns an empty array when the file is empty or only has blank lines', async () => {
    mockReadFile.mockResolvedValue('\n\n\n');
    const result = await readFileArtists('mock/path/artists.txt');
    expect(result).toEqual([]);
  });

  it('handles a file with only one artist', async () => {
    mockReadFile.mockResolvedValue('Single Artist');
    const result = await readFileArtists('mock/path/artists.txt');
    expect(result).toEqual(['Single Artist']);
  });

  it('throws if readFile rejects', async () => {
    mockReadFile.mockRejectedValue(new Error('File read error'));
    await expect(readFileArtists('bad/path.txt')).rejects.toThrow(
      'File read error',
    );
  });
});
