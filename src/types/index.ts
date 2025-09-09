export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
}

export interface MusicRelease {
  artist: string;
  title: string;
  releaseDate: string;
  type: "album" | "single" | "compilation";
  totalTracks: number;
  url: string;
  imageUrl?: string;
  genres: string[];
  popularity?: number;
  markets: string[];
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  popularity: number;
  followers: number;
}

export interface ScrapingOptions {
  startDate: string;
  endDate: string;
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
