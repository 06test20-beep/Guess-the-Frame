import type { Question, LevelId, QuestionType } from '../types';
import DEFAULT_QUESTIONS from '../data/questions';

// ─────────────────────────────────────────────────────────────────────────────
//  Question Storage — localStorage persistence layer
//
//  Key rules (per spec):
//  • localStorage is the admin/custom layer; never touched by game reset.
//  • getQuestionsForLevel() is the SINGLE entry point for all question data.
//  • Default questions.ts is always the fallback; never overwritten.
//  • Images are compressed to JPEG before base64 encoding to conserve storage.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = (level: LevelId) => `gtf_questions_level_${level}`;
const ALL_LEVELS: LevelId[] = [1, 2, 3, 4];

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoredQuestion {
  id: string;
  level: LevelId;
  questionNumber: number;
  type: QuestionType;
  /** base64 data URL — overrides imagePath at runtime when present */
  imageData?: string;
  /** Original asset path — kept for fallback to /public/assets/levels/… */
  imagePath?: string;
  dialogue?: string;
  hint?: string;
  answer: string;
  year?: number;
}

// ── Image compression ────────────────────────────────────────────────────────

/**
 * Compress an image File to a JPEG base64 data URL via Canvas.
 * Images wider than maxWidth are scaled down proportionally.
 * This reduces localStorage usage significantly for large photos.
 */
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

// ── Write ────────────────────────────────────────────────────────────────────

export function saveLevel(level: LevelId, questions: StoredQuestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY(level), JSON.stringify(questions));
  } catch (e) {
    console.error('[GTF Admin] localStorage write failed:', e);
    alert(
      'Storage quota exceeded. Try removing some images, or use the Export button ' +
      'to back up your data and then reset a level to free space.',
    );
  }
}

export function clearLevel(level: LevelId): void {
  localStorage.removeItem(STORAGE_KEY(level));
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function loadStoredLevel(level: LevelId): StoredQuestion[] | null {
  const raw = localStorage.getItem(STORAGE_KEY(level));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredQuestion[];
  } catch {
    return null;
  }
}

/** True if this level has been customised via the Admin Panel. */
export function levelHasCustomData(level: LevelId): boolean {
  return localStorage.getItem(STORAGE_KEY(level)) !== null;
}

// ── Conversion helpers ───────────────────────────────────────────────────────

function storedToQuestion(sq: StoredQuestion): Question {
  return {
    id:             sq.id,
    level:          sq.level,
    questionNumber: sq.questionNumber,
    type:           sq.type,
    // imageData (base64) takes priority over imagePath
    imagePath:      sq.imageData ?? sq.imagePath,
    dialogue:       sq.dialogue,
    hint:           sq.hint,
    answer:         sq.answer,
    year:           sq.year,
  };
}

/**
 * Convert default Question records into StoredQuestion shape for the Admin Panel.
 * imageData is left undefined so the game still reads from /public/assets/.
 */
export function getDefaultStoredQuestions(level: LevelId): StoredQuestion[] {
  return DEFAULT_QUESTIONS
    .filter(q => q.level === level)
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .map(q => ({
      id:             q.id,
      level:          q.level,
      questionNumber: q.questionNumber,
      type:           q.type,
      imagePath:      q.imagePath,
      imageData:      undefined,
      dialogue:       q.dialogue,
      hint:           q.hint,
      answer:         q.answer,
      year:           q.year,
    }));
}

// ── Central question accessor (used by the GAME, not just admin) ─────────────

/**
 * THE single source of truth for questions during gameplay.
 *
 * Priority:
 *   1. Admin-saved questions from localStorage (custom images + answers).
 *   2. Default questions from questions.ts (original fallback).
 */
export function getQuestionsForLevel(level: LevelId): Question[] {
  const stored = loadStoredLevel(level);
  if (stored && stored.length > 0) {
    return stored
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map(storedToQuestion);
  }
  // Fall through to built-in defaults
  return DEFAULT_QUESTIONS
    .filter(q => q.level === level)
    .sort((a, b) => a.questionNumber - b.questionNumber);
}

// ── Export ───────────────────────────────────────────────────────────────────

/**
 * Download all question data (custom + defaults where no custom exists) as JSON.
 * The exported file can be re-imported later via importFromJSON().
 */
export function exportAllAsJSON(): void {
  const payload: Record<string, StoredQuestion[]> = {};
  ALL_LEVELS.forEach(lvl => {
    const stored = loadStoredLevel(lvl);
    payload[`level_${lvl}`] = stored ?? getDefaultStoredQuestions(lvl);
  });
  const blob     = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  anchor.href    = url;
  anchor.download = `guess-the-frame-questions-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── Import ───────────────────────────────────────────────────────────────────

/**
 * Parse and store question data from a previously exported JSON file.
 * Only levels present in the JSON are updated; others are left untouched.
 * Returns an array of level IDs that were successfully imported.
 */
export function importFromJSON(
  raw: string,
): { ok: true; levels: LevelId[] } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const imported: LevelId[] = [];

    ALL_LEVELS.forEach(lvl => {
      const key  = `level_${lvl}`;
      const data = parsed[key];
      if (!Array.isArray(data) || data.length === 0) return;
      // Basic shape validation
      const valid = (data as StoredQuestion[]).every(
        q => typeof q.id === 'string' && typeof q.answer === 'string',
      );
      if (!valid) return;
      saveLevel(lvl, data as StoredQuestion[]);
      imported.push(lvl);
    });

    if (imported.length === 0) {
      return { ok: false, error: 'No valid level data found in the JSON file.' };
    }
    return { ok: true, levels: imported };
  } catch {
    return { ok: false, error: 'Invalid JSON file. Please use an exported file from this app.' };
  }
}
