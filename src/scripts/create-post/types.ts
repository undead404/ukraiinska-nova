import type { EnhancedMusicRelease } from '../../types/index.js';

export interface UnifiedRelease extends EnhancedMusicRelease {
  urls: string[];
}
