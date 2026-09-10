// ─────────────────────────────────────────────────────────────────────────────
//  Session Snapshot Builder
//  Converts host-uploaded StoredQuestion data into an immutable server snapshot.
//  Enforces size limits, deduplicates images, and cleanly separates
//  secret server data from player-visible client data.
// ─────────────────────────────────────────────────────────────────────────────

import {
  SessionSnapshot,
  SessionLevel,
  ServerQuestion,
  ClientQuestion,
  SessionAsset,
  LevelId,
  ONLINE_SESSION_MAX_IMAGE_BYTES,
} from '../types/shared';

// ── Input shape from host (mirrors frontend's StoredQuestion) ─────────────────
export interface HostStoredQuestion {
  id: string;
  level: number;
  questionNumber: number;
  type: string;
  imageData?: string;      // base64 data URL — eye crop / frame image
  imagePath?: string;
  fullImageData?: string;  // eye questions only — full-face image for reveal
  dialogue?: string;
  hint?: string;
  answer: string;
  aliases?: string[];      // host-defined alternate answers
  year?: number;
}

export interface HostGamePayload {
  selectedGames: LevelId[];
  levels: Record<string, HostStoredQuestion[]>;
}

export interface SnapshotBuildResult {
  snapshot: SessionSnapshot;
  assets: Map<string, SessionAsset>; // imageKey → asset
}

/**
 * Build an immutable session snapshot from the host's uploaded data.
 * This is called once when the game starts and never updated again.
 *
 * Key responsibilities:
 * - Strip answer/alias data from ClientQuestion
 * - Deduplicate images (same base64 → same key)
 * - Enforce 50MB total image size limit
 * - Map imagePath references so clients can fetch them
 */
export function buildSessionSnapshot(
  payload: HostGamePayload,
  defaultQuestionsProvider: (levelId: LevelId) => HostStoredQuestion[]
): SnapshotBuildResult {
  const assets = new Map<string, SessionAsset>();
  // Dedup: data URL → asset key
  const dataToKey = new Map<string, string>();
  let totalImageBytes = 0;

  const levels: Partial<Record<LevelId, SessionLevel>> = {};

  for (const levelId of payload.selectedGames) {
    const rawQuestions: HostStoredQuestion[] =
      payload.levels[levelId.toString()] ?? defaultQuestionsProvider(levelId);

    const serverQuestions: ServerQuestion[] = [];
    const clientQuestions: ClientQuestion[] = [];

    const sortedQuestions = [...rawQuestions].sort(
      (a, b) => a.questionNumber - b.questionNumber
    );

    for (const q of sortedQuestions) {
      // ── Server-secret record ──────────────────────────────────────────────
      const serverQ: ServerQuestion = {
        id: q.id,
        level: levelId,
        questionNumber: q.questionNumber,
        type: q.type as ServerQuestion['type'],
        answer: q.answer,
        aliases: q.aliases ?? [],
        year: q.year,
      };
      serverQuestions.push(serverQ);

      // ── Client-visible record (NO answer, NO aliases, NO year) ───────────
      const clientQ: ClientQuestion = {
        id: q.id,
        level: levelId,
        questionNumber: q.questionNumber,
        type: q.type as ClientQuestion['type'],
        dialogue: q.dialogue,
        hint: q.hint,
      };

      // ── Crop image handling ───────────────────────────────────────────────
      if (q.imageData) {
        if (dataToKey.has(q.imageData)) {
          clientQ.imageKey = dataToKey.get(q.imageData)!;
        } else {
          const estimatedBytes = Math.ceil((q.imageData.length * 3) / 4);
          if (totalImageBytes + estimatedBytes > ONLINE_SESSION_MAX_IMAGE_BYTES) {
            console.warn(`[Snapshot] Image size limit reached. Skipping crop for question ${q.id}. Using imagePath fallback.`);
            clientQ.imageKey = q.imagePath ? `path:${q.imagePath}` : undefined;
          } else {
            totalImageBytes += estimatedBytes;
            const key = `img_${q.id}`;
            const mimeMatch = q.imageData.match(/^data:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            assets.set(key, { key, mimeType, data: q.imageData });
            dataToKey.set(q.imageData, key);
            clientQ.imageKey = key;
          }
        }
      } else if (q.imagePath) {
        clientQ.imageKey = `path:${q.imagePath}`;
      }

      // ── Full image handling (eye questions only) ──────────────────────────
      if (q.type === 'eye' && q.fullImageData) {
        if (dataToKey.has(q.fullImageData)) {
          clientQ.fullImageKey = dataToKey.get(q.fullImageData)!;
        } else {
          const estimatedBytes = Math.ceil((q.fullImageData.length * 3) / 4);
          if (totalImageBytes + estimatedBytes > ONLINE_SESSION_MAX_IMAGE_BYTES) {
            console.warn(`[Snapshot] Image size limit reached. Skipping full image for question ${q.id}.`);
          } else {
            totalImageBytes += estimatedBytes;
            const key = `img_full_${q.id}`;
            const mimeMatch = q.fullImageData.match(/^data:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            assets.set(key, { key, mimeType, data: q.fullImageData });
            dataToKey.set(q.fullImageData, key);
            clientQ.fullImageKey = key;
          }
        }
      }

      clientQuestions.push(clientQ);
    }

    levels[levelId] = {
      levelId,
      serverQuestions,
      clientQuestions,
    };
  }

  const snapshot: SessionSnapshot = {
    createdAt: Date.now(),
    selectedGames: payload.selectedGames,
    levels: levels as Record<LevelId, SessionLevel>,
    totalImageBytes,
  };

  console.log(
    `[Snapshot] Built session: ${payload.selectedGames.length} games, ` +
    `${assets.size} unique images, ${(totalImageBytes / 1024 / 1024).toFixed(2)} MB`
  );

  return { snapshot, assets };
}
