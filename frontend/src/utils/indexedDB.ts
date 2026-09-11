export const DB_NAME = 'GuessTheyFrameDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'images';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`IndexedDB open failed: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

export async function saveImage(key: string, base64Data: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(base64Data, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save image: ${request.error?.message}`));
  });
}

export async function getImage(key: string): Promise<string | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result as string | undefined);
    request.onerror = () => reject(new Error(`Failed to get image: ${request.error?.message}`));
  });
}

export async function deleteImage(key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete image: ${request.error?.message}`));
  });
}

export async function getAllImageKeys(): Promise<string[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(new Error(`Failed to get all image keys: ${request.error?.message}`));
  });
}

export async function clearAllImages(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear images: ${request.error?.message}`));
  });
}

/**
 * Performs reference-aware cleanup of IndexedDB images.
 * Scans all localStorage modes to find used image keys,
 * then deletes any IndexedDB keys that are not referenced.
 */
export async function cleanupUnusedImages(): Promise<void> {
  const usedKeys = new Set<string>();

  // Scan localStorage for references
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('gtf_mode_data_') || key.startsWith('gtf_questions_level_'))) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const questions = JSON.parse(raw);
          if (Array.isArray(questions)) {
            for (const q of questions) {
              if (typeof q.imageData === 'string' && q.imageData.startsWith('idb://')) {
                usedKeys.add(q.imageData);
              }
              if (typeof q.fullImageData === 'string' && q.fullImageData.startsWith('idb://')) {
                usedKeys.add(q.fullImageData);
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  try {
    const allStoredKeys = await getAllImageKeys();
    for (const storedKey of allStoredKeys) {
      if (!usedKeys.has(storedKey)) {
        console.log(`[GTF Cleanup] Deleting orphaned image: ${storedKey}`);
        await deleteImage(storedKey).catch(e => console.error(e));
      }
    }
  } catch (e) {
    console.error('[GTF Cleanup] Failed to get all image keys:', e);
  }
}
