import enhanceReleases from '../../common/enhance-releases.js';
import type { MusicRelease } from '../../common/schemata.js';
import convertAsyncGeneratorToArray from '../../helpers/convert-async-generator-to-array.js';
import { SpotifyService } from '../../services/spotify.js';
import type { ScrapingOptions } from '../../types/index.js';

import chooseArtists from './choose-artists.js';
import environment from './environment.js';
import mergeOldAndNewReleases from './merge-old-and-new-releases.js';
import openSavedReleases from './open-saved-releases.js';
import postToBluesky from './post-to-bluesky.js';
import readFileArtistIds from './read-artist-ids.js';
import saveReleases from './save-releases.js';

async function main(): Promise<void> {
  try {
    // Конфігурація Spotify API
    const spotifyConfig = {
      clientId: environment.SPOTIFY_CLIENT_ID,
      clientSecret: environment.SPOTIFY_CLIENT_SECRET,
    };

    // Зчитати шлях до файлу з артистами з командного рядка або використовувати за замовчуванням
    const artistsFilePath =
      process.argv[2] && process.argv[2].trim() !== ''
        ? process.argv[2]
        : './artist-ids.csv';

    const artists = await readFileArtistIds(artistsFilePath);
    if (artists.length === 0) {
      throw new Error('Список артистів порожній. Додайте артистів у файл.');
    }

    const targetArtists = chooseArtists(artists);

    const options: ScrapingOptions = {
      // startDate: targetDateString,
      // endDate: targetDateString,
      includeCompilations: false,
      includeAppears: true,
      country: 'UA',
    };

    // Ініціалізація сервісів
    console.log('🎵 Ініціалізація Ukraiinska Nova');
    console.log('='.repeat(50));

    const spotifyService = new SpotifyService(spotifyConfig);

    const allNewReleases: MusicRelease[] = [];

    for (const artist of targetArtists) {
      console.log(`Отримання релізів: ${artist.name} (${artist.id})`);
      const oldReleases = await openSavedReleases(artist.id, artist.name);
      const releases = await spotifyService.getArtistReleases(
        artist.id,
        artist.name,
        options,
      );
      const { new: newReleases, merged: mergedReleases } =
        mergeOldAndNewReleases(oldReleases, releases);
      await saveReleases(artist.id, artist.name, mergedReleases);

      if (oldReleases.length > 0) {
        // otherwise, the artist itself is newly found
        allNewReleases.push(...newReleases);
      }
    }

    const enhancedReleases = await convertAsyncGeneratorToArray(
      enhanceReleases(environment.LASTFM_API_KEY, allNewReleases),
    );

    await postToBluesky(enhancedReleases);

    console.log('\n✅ Обробка завершена!');
  } catch (error) {
    console.error('❌ Помилка виконання скрипта:', error);
    process.exit(1);
  }
}

await main();
