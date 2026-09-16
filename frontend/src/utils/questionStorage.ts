import type { Question, LevelId, QuestionType, ModeId, GameMode } from '../types';
import DEFAULT_QUESTIONS from '../data/questions';
import { LEVEL_ID_TO_MODE_ID, MODE_ID_TO_LEVEL_ID } from '../constants/game';
import { cleanupUnusedImages } from './indexedDB';

// ─────────────────────────────────────────────────────────────────────────────
//  Question Storage — localStorage persistence layer (V2)
//
//  V2 storage key format:  gtf_mode_data_<modeId>
//  V1 storage key format:  gtf_questions_level_<number>  (read-only fallback)
//
//  Key rules:
//  • getQuestionsForMode() is the SINGLE V2 entry point for all question data.
//  • getQuestionsForLevel() is kept as a V1 compat wrapper.
//  • V1 keys are read as a fallback if no V2 data exists yet.
//  • V1 keys are NEVER deleted by this layer — migration is non-destructive.
//  • Images are compressed to JPEG before base64 encoding to conserve storage.
//
//  NOTE: modeRegistry.ts depends on this file. To avoid circular imports,
//  this file does NOT import modeRegistry. Instead, callers that need both
//  pass registry data in as arguments (exportAllAsJSON, importFromJSON).
// ─────────────────────────────────────────────────────────────────────────────

// ─── Storage key helpers ─────────────────────────────────────────────────────

const V2_KEY = (modeId: ModeId) => `gtf_mode_data_${modeId}`;
const V1_KEY = (level: LevelId) => `gtf_questions_level_${level}`;
const GTF_REGISTRY_KEY = 'gtf_mode_registry';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredQuestion {
  id: string;
  level: LevelId;       // V1 compat — kept for existing exports
  modeId?: ModeId;      // V2 — preferred reference
  questionNumber: number;
  type: QuestionType;
  /** base64 data URL — overrides imagePath at runtime when present (eye crop / frame image) */
  imageData?: string;
  /** Original asset path — kept for fallback to /public/assets/levels/… */
  imagePath?: string;
  /** eye questions only: full-face base64 data URL shown at answer reveal */
  fullImageData?: string;
  dialogue?: string;
  hint?: string;
  answer: string;
  year?: number;
}

// ─── Image compression ────────────────────────────────────────────────────────

export function compressImage(
  file: File,
  maxWidth  = 1280,
  quality   = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    img.src = objectUrl;
  });
}

// ─── V2 Write ─────────────────────────────────────────────────────────────────

export function saveModeQuestions(modeId: ModeId, questions: StoredQuestion[]): void {
  try {
    localStorage.setItem(V2_KEY(modeId), JSON.stringify(questions));
    // Fire and forget cleanup
    cleanupUnusedImages().catch(e => console.error('[GTF] Cleanup failed:', e));
  } catch (e) {
    console.error('[GTF Admin] localStorage write failed:', e);
    alert(
      'Storage quota exceeded. Try removing some images, or use the Export button ' +
      'to back up your data and then reset a mode to free space.',
    );
  }
}

export function clearModeQuestions(modeId: ModeId): void {
  localStorage.removeItem(V2_KEY(modeId));
  cleanupUnusedImages().catch(e => console.error('[GTF] Cleanup failed:', e));
}

/**
 * Deep copy questions from a source mode to a target mode.
 * Assigns new internal IDs and target modeId to fully decouple them.
 */
export function duplicateModeQuestions(sourceId: ModeId, targetId: ModeId): void {
  // We use loadStoredMode because it handles the fallback to V1 or defaults.
  const sourceQuestions = loadStoredMode(sourceId);
  if (!sourceQuestions || sourceQuestions.length === 0) return;

  const duplicated = sourceQuestions.map(sq => ({
    ...sq,
    id: `m_${targetId}_q${String(sq.questionNumber).padStart(2, '0')}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    modeId: targetId,
    level: 1 as LevelId // Dummy level to satisfy types
  }));

  saveModeQuestions(targetId, duplicated);
}

/** True if this mode has been customized via the Admin Panel (V2 data). */
export function modeHasCustomData(modeId: ModeId): boolean {
  return localStorage.getItem(V2_KEY(modeId)) !== null;
}

// ─── V2 Read ──────────────────────────────────────────────────────────────────

export function loadStoredMode(modeId: ModeId): StoredQuestion[] | null {
  // Try V2 key first
  const raw2 = localStorage.getItem(V2_KEY(modeId));
  if (raw2) {
    try { return JSON.parse(raw2) as StoredQuestion[]; } catch { /* fall through */ }
  }

  // Fall back to V1 key (for built-in modes with a legacyLevelId mapping)
  const levelId = MODE_ID_TO_LEVEL_ID[modeId];
  if (levelId !== undefined) {
    const raw1 = localStorage.getItem(V1_KEY(levelId as LevelId));
    if (raw1) {
      try {
        const parsed = JSON.parse(raw1) as StoredQuestion[];
        // Opportunistically migrate: write V2 key if read succeeds
        saveModeQuestions(modeId, parsed);
        return parsed;
      } catch { /* fall through */ }
    }
  }

  return null;
}

// ─── V1 compat shims (backed by V2 storage) ──────────────────────────────────

/** @deprecated Use saveModeQuestions() instead. Kept for backward compat. */
export function saveLevel(level: LevelId, questions: StoredQuestion[]): void {
  const modeId = LEVEL_ID_TO_MODE_ID[level];
  if (modeId) {
    saveModeQuestions(modeId, questions);
  } else {
    try { localStorage.setItem(V1_KEY(level), JSON.stringify(questions)); }
    catch (e) { console.error('[GTF] Legacy saveLevel failed:', e); }
  }
}

/** @deprecated Use clearModeQuestions() instead. */
export function clearLevel(level: LevelId): void {
  const modeId = LEVEL_ID_TO_MODE_ID[level];
  if (modeId) clearModeQuestions(modeId);
  else localStorage.removeItem(V1_KEY(level));
}

/** @deprecated Use loadStoredMode() instead. */
export function loadStoredLevel(level: LevelId): StoredQuestion[] | null {
  const modeId = LEVEL_ID_TO_MODE_ID[level];
  if (modeId) return loadStoredMode(modeId);
  const raw = localStorage.getItem(V1_KEY(level));
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredQuestion[]; } catch { return null; }
}

/** @deprecated Use modeHasCustomData() instead. */
export function levelHasCustomData(level: LevelId): boolean {
  const modeId = LEVEL_ID_TO_MODE_ID[level];
  if (modeId) return modeHasCustomData(modeId);
  return localStorage.getItem(V1_KEY(level)) !== null;
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

function storedToQuestion(sq: StoredQuestion, modeId?: ModeId): Question {
  return {
    id:             sq.id,
    level:          sq.level,
    modeId:         sq.modeId ?? modeId ?? LEVEL_ID_TO_MODE_ID[sq.level] ?? String(sq.level),
    questionNumber: sq.questionNumber,
    type:           sq.type,
    // Keep static path and IDB/base64 reference SEPARATE so each consumer
    // can use the right field: AsyncImage uses imagePath (handles idb:// inline),
    // while online startGame uses imageData to detect and resolve idb:// keys.
    imagePath:      sq.imagePath,
    imageData:      sq.imageData,
    fullImagePath:  undefined,          // no static full-image path in StoredQuestion
    fullImageData:  sq.fullImageData,
    dialogue:       sq.dialogue,
    hint:           sq.hint,
    answer:         sq.answer,
    year:           sq.year,
  };
}

export function getDefaultStoredQuestions(level: LevelId): StoredQuestion[] {
  const modeId = LEVEL_ID_TO_MODE_ID[level] ?? String(level);
  return DEFAULT_QUESTIONS
    .filter(q => q.level === level)
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .map(q => ({
      id:             q.id,
      level:          q.level,
      modeId,
      questionNumber: q.questionNumber,
      type:           q.type,
      imagePath:      q.imagePath,
      imageData:      undefined as string | undefined,
      dialogue:       q.dialogue,
      hint:           q.hint,
      answer:         q.answer,
      year:           q.year,
    }));
}

// ─── Central question accessors ───────────────────────────────────────────────

/**
 * V2: Get questions for a given ModeId.
 * Priority: V2 admin data → V1 admin data → built-in defaults.
 */
export function getQuestionsForMode(modeId: ModeId): Question[] {
  const stored = loadStoredMode(modeId);
  if (stored && stored.length > 0) {
    return stored
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map(sq => storedToQuestion(sq, modeId));
  }

  // Built-in fallback via legacy level ID
  const levelId = MODE_ID_TO_LEVEL_ID[modeId];
  if (levelId !== undefined) {
    return DEFAULT_QUESTIONS
      .filter(q => q.level === levelId)
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map(q => ({ ...q, modeId }));
  }

  return [];
}

/**
 * V1 compat: Get questions by numeric LevelId.
 * Delegates to getQuestionsForMode() via the legacy mapping.
 */
export function getQuestionsForLevel(level: LevelId): Question[] {
  const modeId = LEVEL_ID_TO_MODE_ID[level];
  if (modeId) return getQuestionsForMode(modeId);

  // Unmapped level: direct V1 read
  const stored = loadStoredLevel(level);
  if (stored && stored.length > 0) {
    return stored
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map(sq => storedToQuestion(sq));
  }
  return DEFAULT_QUESTIONS
    .filter(q => q.level === level)
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .map(q => ({ ...q, modeId: String(level) }));
}

// ─── V2 Export ────────────────────────────────────────────────────────────────

/**
 * V2 Export: Downloads the full dynamic mode system as JSON.
 * Reconstructs Base64 image data from IndexedDB before exporting.
 * Accepts the registry directly to avoid circular imports.
 */
export async function exportAllAsJSON(registry: GameMode[]): Promise<void> {
  const modeData: Record<string, StoredQuestion[]> = {};

  for (const mode of registry) {
    const stored = loadStoredMode(mode.id);
    if (stored && stored.length > 0) {
      modeData[mode.id] = stored;
    }
  }

  // Reconstruct images from IndexedDB
  const { getImage } = await import('./indexedDB');
  const { isIdbKey } = await import('./migration');
  
  for (const questions of Object.values(modeData)) {
    for (const q of questions) {
      if (q.imageData && isIdbKey(q.imageData)) {
        const base64 = await getImage(q.imageData);
        if (base64) q.imageData = base64;
      }
      if (q.fullImageData && isIdbKey(q.fullImageData)) {
        const base64 = await getImage(q.fullImageData);
        if (base64) q.fullImageData = base64;
      }
    }
  }

  const payload = {
    _version: 2,
    _exportedAt: new Date().toISOString(),
    registry,
    modeData,
  };

  const blob     = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  anchor.href    = url;
  anchor.download = `guess-the-frame-v2-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── V2 Import ────────────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true; message: string; modesImported: number; isV1: boolean; newRegistry?: GameMode[] }
  | { ok: false; error: string };

/**
 * V2 Import: Parse and restore a previously exported JSON file.
 * Supports both V2 format and V1 format (backward compat).
 * Does NOT call modeRegistry.ts directly — returns the new registry for the
 * caller (AdminPage) to apply via modeRegistry.saveRegistry().
 */
export async function importFromJSON(raw: string): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (parsed._version === 2) {
      return await importV2(parsed);
    }

    const isV1Shape = Object.keys(parsed).some(k => /^level_\d+$/.test(k));
    if (isV1Shape) {
      return await importV1(parsed);
    }

    return { ok: false, error: 'Unrecognized JSON format. Expected a Guess The Frame export file.' };
  } catch {
    return { ok: false, error: 'Invalid JSON file. Please use an exported file from this app.' };
  }
}

async function importV2(payload: Record<string, unknown>): Promise<ImportResult> {
  let newRegistry: GameMode[] | undefined;
  let modesImported = 0;

  if (Array.isArray(payload.registry)) {
    const modes = payload.registry as GameMode[];
    if (modes.every(m => typeof m.id === 'string' && typeof m.name === 'string' && typeof m.templateId === 'string')) {
      newRegistry = modes;
      modesImported = modes.length;
    }
  }

  const { saveImage } = await import('./indexedDB');
  const { generateImageKey, isBase64 } = await import('./migration');

  if (payload.modeData && typeof payload.modeData === 'object') {
    const modeData = payload.modeData as Record<string, StoredQuestion[]>;
    for (const [modeId, questions] of Object.entries(modeData)) {
      if (!Array.isArray(questions) || questions.length === 0) continue;
      const valid = questions.every(q => typeof q.id === 'string' && typeof q.answer === 'string');
      if (!valid) continue;

      // Extract base64 images and save to IndexedDB
      for (const q of questions) {
        if (q.imageData && isBase64(q.imageData)) {
          const key = generateImageKey();
          await saveImage(key, q.imageData);
          q.imageData = key;
        }
        if (q.fullImageData && isBase64(q.fullImageData)) {
          const key = generateImageKey();
          await saveImage(key, q.fullImageData);
          q.fullImageData = key;
        }
      }

      saveModeQuestions(modeId, questions);
    }
  }

  if (modesImported === 0 && !newRegistry) {
    return { ok: false, error: 'V2 JSON contained no valid registry data.' };
  }

  // Also write the registry to localStorage directly so it persists
  if (newRegistry) {
    try { localStorage.setItem(GTF_REGISTRY_KEY, JSON.stringify(newRegistry)); } catch { /* ignore */ }
  }

  return {
    ok: true,
    message: `Imported ${modesImported} mode(s) from V2 backup.`,
    modesImported,
    isV1: false,
    newRegistry,
  };
}

async function importV1(parsed: Record<string, unknown>): Promise<ImportResult> {
  const ALL_LEVELS: LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let modesImported = 0;

  const { saveImage } = await import('./indexedDB');
  const { generateImageKey, isBase64 } = await import('./migration');

  for (const lvl of ALL_LEVELS) {
    const key  = `level_${lvl}`;
    const data = parsed[key];
    if (!Array.isArray(data) || data.length === 0) continue;
    const valid = (data as StoredQuestion[]).every(
      q => typeof q.id === 'string' && typeof q.answer === 'string',
    );
    if (!valid) continue;

    const questions = data as StoredQuestion[];
    for (const q of questions) {
      if (q.imageData && isBase64(q.imageData)) {
        const idbKey = generateImageKey();
        await saveImage(idbKey, q.imageData);
        q.imageData = idbKey;
      }
      if (q.fullImageData && isBase64(q.fullImageData)) {
        const idbKey = generateImageKey();
        await saveImage(idbKey, q.fullImageData);
        q.fullImageData = idbKey;
      }
    }

    const modeId = LEVEL_ID_TO_MODE_ID[lvl];
    if (modeId) {
      saveModeQuestions(modeId, questions);
    } else {
      try { localStorage.setItem(V1_KEY(lvl), JSON.stringify(questions)); } catch { /* ignore */ }
    }
    modesImported++;
  }

  if (modesImported === 0) {
    return { ok: false, error: 'No valid level data found in the V1 JSON file.' };
  }

  return {
    ok: true,
    message: `Imported ${modesImported} level(s) from V1 backup (mapped to V2 modes).`,
    modesImported,
    isV1: true,
  };
}
