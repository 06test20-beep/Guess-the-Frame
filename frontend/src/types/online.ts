// ─────────────────────────────────────────────────────────────────────────────
//  Shared Online Multiplayer types — frontend mirror of backend/src/types/shared.ts
//  Keep in sync manually. No framework imports.
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType = 'frame' | 'eye' | 'dialogue';
export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Player-visible question data — contains NO secret answer info */
export interface ClientQuestion {
  id: string;
  level: LevelId;
  questionNumber: number;
  type: QuestionType;
  dialogue?: string;
  hint?: string;
  /** 'path:/assets/...' for public static assets, 'img_xxx' for session assets — eye crop shown during question */
  imageKey?: string;
  /** eye questions only: 'path:/assets/...' or 'img_xxx' for the full-face image shown at answer reveal */
  fullImageKey?: string;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  avatarId: string;
  isReady: boolean;
  score: number;
  streak: number;
  connected: boolean;
  joinedAt: number;
}

export type RoundPhase =
  | 'intro'
  | 'active'
  | 'first_correct'
  | 'reveal'
  | 'next';

export interface RoomState {
  code: string;
  hostId: string | null;
  players: OnlinePlayer[];
  state: 'lobby' | 'playing' | 'results';

  // Playing phase fields
  currentModeId?: ModeId;
  currentLevelId?: LevelId; // V1 compat
  currentModeIndex?: number;
  currentRoundNumber?: number;
  totalRoundsInMode?: number;
  roundPhase?: RoundPhase;
  roundEndTimeMs?: number;
  firstCorrectTimeMs?: number;
  currentClientQuestion?: ClientQuestion;
  revealedAnswer?: string;
}

export interface FinalScore {
  id: string;
  name: string;
  avatarId: string;
  score: number;
  streak: number;
  rank: number;
}

export interface ActivityFeedItem {
  type: 'correct_guess' | 'wrong_guess' | 'near_miss';
  playerName: string;
  guess?: string;
  position?: number;
}

// Scoring constants (mirrors backend — for UI display only, NOT used for calculation)
export const ONLINE_BASE_POINTS  = 100;
export const ONLINE_WRONG_POINTS = -2;
export const ONLINE_ROUND_DURATION_MS = 30_000;
export const ONLINE_FIRST_CORRECT_WINDOW_MS = 5_000;
