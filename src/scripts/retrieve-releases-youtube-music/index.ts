import path from 'node:path';

import enhanceReleases from '../../common/enhance-releases.js';
import postToBluesky from '../../common/post-to-bluesky.js';
import postToTelegram from '../../common/post-to-telegram.js';
import readFileArtistIds from '../../common/read-artist-ids.js';
import { YOUTUBE_MUSIC_RELEASES_DATA_FOLDER } from '../../constants.js';
import chooseArtists from '../../helpers/choose-artists.js';
import mapReleasesToPosts from '../../helpers/map-releases-to-posts.js';
import mergeOldAndNewReleases from '../../helpers/merge-old-and-new-releases.js';
import { YouTubeMusicService } from '../../services/youtube-music.js';
import type { EnhancedMusicRelease } from '../../types/index.js';

import environment from './environment.js';
import openSavedReleases from './open-saved-releases.js';
import saveReleases from './save-releases.js';

async function main(): Promise<void> {
  try {
    const folder = path.join(...YOUTUBE_MUSIC_RELEASES_DATA_FOLDER);

    // Зчитати шлях до файлу з артистами з командного рядка або використовувати за замовчуванням
    const artistsFilePath =
      process.argv[2] && process.argv[2].trim() !== ''
        ? process.argv[2]
        : './artist-ids.csv';

    const artists = await readFileArtistIds(artistsFilePath);
    if (artists.length === 0) {
      throw new Error('Список артистів порожній. Додайте артистів у файл.');
    }

    const targetArtists = chooseArtists(
      artists
        .filter(({ youtubeMusicId }) => youtubeMusicId)
        // Deduplicate by youtubeMusicId
        .filter(
          ({ youtubeMusicId }, index, collection) =>
            collection.findIndex(
              ({ youtubeMusicId: firstYoutubeMusicId }) =>
                firstYoutubeMusicId === youtubeMusicId,
            ) === index,
        )
        .map(({ name, youtubeMusicId }) => ({ id: youtubeMusicId, name })),
    );

    // Ініціалізація сервісів
    console.log('🎵 Ініціалізація Ukraiinska Nova');
    console.log('='.repeat(50));

    const ytmService = new YouTubeMusicService();

    const allNewReleases: EnhancedMusicRelease[] = [];

    console.log(
      `Цільові артисти: ${targetArtists.map((artist) => artist.name)}`,
    );

    const tasksForLater: (() => Promise<void>)[] = [];

    for (const artist of targetArtists) {
      const oldReleases = await openSavedReleases(
        folder,
        artist.id,
        artist.name,
      );
      const releases = await ytmService.getArtistReleases(
        artist.id,
        artist.name,
      );
      const enhancedReleases = await enhanceReleases(
        environment.LASTFM_API_KEY,
        releases,
      );
      const { new: newReleases, merged: mergedReleases } =
        mergeOldAndNewReleases(oldReleases, enhancedReleases);
      tasksForLater.push(() =>
        saveReleases(folder, artist.id, artist.name, mergedReleases),
      );

      if (oldReleases.length > 0) {
        // otherwise, the artist itself is newly found
        allNewReleases.push(...newReleases);
      }
    }

    console.log(`Знайдено ${allNewReleases.length} нових релізів`);

    if (allNewReleases.length > 0) {
      const posts = mapReleasesToPosts(allNewReleases);
      await postToBluesky(
        environment.BLUESKY_IDENTIFIER_FOR_YOUTUBE_MUSIC,
        environment.BLUESKY_PASSWORD_FOR_YOUTUBE_MUSIC,
        posts,
      );
      await postToTelegram(
        environment.TELEGRAM_BOT_TOKEN,
        environment.TELEGRAM_CHANNEL_FOR_YOUTUBE_MUSIC,
        posts,
      );
    }

    await Promise.all(tasksForLater.map((task) => task()));

    console.log('\n✅ Обробка завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка виконання скрипта:', error);
    process.exit(1);
  }
}

await main();
