import { saveImage } from './indexedDB';
import type { StoredQuestion } from './questionStorage';

export const IDB_PREFIX = 'idb://';

export function generateImageKey(): string {
  return `${IDB_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isIdbKey(url?: string): boolean {
  return url?.startsWith(IDB_PREFIX) ?? false;
}

export function isBase64(url?: string): boolean {
  return url?.startsWith('data:image/') ?? false;
}

/**
 * Migration state manager
 */
let isMigrating = false;
let migrationPromise: Promise<void> | null = null;

export async function migrateLocalStorageToIndexedDB(): Promise<void> {
  if (migrationPromise) return migrationPromise;
  
  isMigrating = true;
  migrationPromise = (async () => {
    try {
      const keysToMigrate = Object.keys(localStorage).filter(
        (key) => key.startsWith('gtf_mode_data_') || key.startsWith('gtf_questions_level_')
      );

      for (const key of keysToMigrate) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
          const questions = JSON.parse(raw) as StoredQuestion[];
          let modified = false;

          for (const q of questions) {
            // Migrate imageData
            if (q.imageData && isBase64(q.imageData)) {
              const imageKey = generateImageKey();
              await saveImage(imageKey, q.imageData);
              q.imageData = imageKey;
              modified = true;
            }

            // Migrate fullImageData (Guess The Eyes)
            if (q.fullImageData && isBase64(q.fullImageData)) {
              const fullImageKey = generateImageKey();
              await saveImage(fullImageKey, q.fullImageData);
              q.fullImageData = fullImageKey;
              modified = true;
            }
          }

          if (modified) {
            // Only save if migration of all images for this mode was successful
            localStorage.setItem(key, JSON.stringify(questions));
          }
        } catch (e) {
          console.error(`[GTF Migration] Failed to migrate key ${key}:`, e);
          // Don't throw, let other modes migrate
        }
      }
    } finally {
      isMigrating = false;
    }
  })();

  return migrationPromise;
}

export function isMigrationInProgress(): boolean {
  return isMigrating;
}
