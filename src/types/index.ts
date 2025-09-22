import type { MusicRelease } from '../common/schemata.js';

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
}

export interface EnhancedMusicRelease extends MusicRelease {
  tags?: string[];
}

export interface SpotifyArtistSearchResult {
  id: string;
  name: string;
  popularity: number;
  followers: number;
}

export interface ScrapingOptions {
  startDate?: string;
  endDate?: string;
  includeCompilations?: boolean;
  includeAppears?: boolean;
  country?: string;
}

export interface ScrapingStats {
  totalReleases: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  byArtist: Record<string, number>;
  processingTime: number;
}

export interface Post {
  imageUrl?: string;
  links?: Array<{ title: string; url: string }>;
  text: string;
}
