// ─────────────────────────────────────────────────────────────────────────────
//  Shared types for the Online Multiplayer system.
//  This file lives in backend/src/types/ but its pure-TypeScript interfaces
//  are mirrored (manually kept in sync) in frontend/src/types/online.ts.
//  No imports from either framework — purely data contracts.
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType = 'frame' | 'eye' | 'dialogue' | 'emoji';
export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // V1 compat
export type ModeId = string;

// ─── Server-secret question record (never sent to players before reveal) ──────
export interface ServerQuestion {
  id: string;
  level?: LevelId; // V1 compat
  modeId: ModeId;
  questionNumber: number;
  type: QuestionType;
  /** Correct answer — NEVER sent to clients before reveal */
  answer: string;
  /** Host-defined alternate acceptable answers — NEVER sent before reveal */
  aliases: string[];
  /** Year — for release-year games — NEVER sent before reveal */
  year?: number;
  // Image is stored separately in the asset store, keyed by id
}

// ─── Player-visible question (safe to broadcast) ─────────────────────────────
export interface ClientQuestion {
  id: string;
  level?: LevelId; // V1 compat
  modeId: ModeId;
  questionNumber: number;
  type: QuestionType;
  /** Present for dialogue/text questions — safe to show */
  dialogue?: string;
  /** Optional hint — safe to show */
  hint?: string;
  /** Image asset key for the eye crop / frame shown during active question */
  imageKey?: string;
  /** eye questions only: asset key for the full-face image shown at answer reveal */
  fullImageKey?: string;
  // NO answer, NO aliases, NO year (until reveal phase)
}

// ─── Asset reference (images stored separately, fetched on demand) ───────────
export interface SessionAsset {
  key: string;          // matches clientQuestion.imageKey
  mimeType: string;
  /** Compressed base64 data — only held in server memory for room lifetime */
  data: string;
}

// ─── Full session snapshot for a game sequence (immutable after game start) ───
export interface SessionMode {
  modeId: ModeId;
  /** Server-only secrets */
  serverQuestions: ServerQuestion[];
  /** Player-visible question metadata */
  clientQuestions: ClientQuestion[];
  /** Game mode definition metadata */
  modeDefinition: any; // GameMode type is frontend-only, we treat it as opaque JSON
}

export interface SessionSnapshot {
  createdAt: number;
  selectedModes: ModeId[];
  modes: Record<ModeId, SessionMode>;
  /** Total size in bytes of all images in session — enforced limit: 50MB */
  totalImageBytes: number;
}

// ─── Round state machine ──────────────────────────────────────────────────────
export type RoundPhase =
  | 'intro'             // level intro / countdown
  | 'active'            // question is live, accepting guesses
  | 'first_correct'     // first player got it, 5s continuation window open
  | 'reveal'            // answer revealed, no more guesses
  | 'next'              // brief pause before next round begins

// ─── Player state ──────────────────────────────────────────────────────────────
export interface OnlinePlayer {
  id: string;
  name: string;
  avatarId: string;
  isReady: boolean;
  score: number;
  streak: number;
  connected: boolean;
  joinedAt: number;     // for deterministic host election
}

// ─── Room state (sent to clients — no secrets) ────────────────────────────────
export interface RoomState {
  code: string;
  hostId: string | null;
  players: OnlinePlayer[];
  phase: 'lobby' | 'playing' | 'results';

  // Round info (populated during 'playing' phase)
  currentModeId?: ModeId;
  currentLevelId?: LevelId; // V1 compat
  currentModeIndex?: number;
  currentRoundNumber?: number;
  totalRoundsInMode?: number;
  roundPhase?: RoundPhase;

  /** UTC ms — clients use this to render a synchronized countdown */
  roundEndTimeMs?: number;
  /** UTC ms — when the first correct answer was recorded (starts 5s window) */
  firstCorrectTimeMs?: number;

  /** Client-safe question data for the current round (no answer) */
  currentClientQuestion?: ClientQuestion;

  /** Set once revealed — the actual answer string */
  revealedAnswer?: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
export const ONLINE_BASE_POINTS  = 100;
export const ONLINE_WRONG_POINTS = -2;
export const ONLINE_SPEED_BONUS_MAX = 50;  // awarded proportionally for fast answers
export const ONLINE_STREAK_BONUS = 15;     // bonus per consecutive correct answer
export const ONLINE_ROUND_DURATION_MS = 30_000;
export const ONLINE_FIRST_CORRECT_WINDOW_MS = 5_000;
export const ONLINE_GUESS_COOLDOWN_MS = 750;
export const ONLINE_SESSION_MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── Socket.IO event contracts ────────────────────────────────────────────────
// Client → Server actions
export type GameActionType =
  | 'TOGGLE_READY'
  | 'START_GAME'
  | 'KICK_PLAYER'
  | 'SUBMIT_GUESS'
  | 'REQUEST_IMAGE'
  | 'REQUEST_IMAGE_FULL';  // client requests the full-face reveal image for an eye question

export interface GameAction {
  type: GameActionType;
  payload?: unknown;
}

// Server → Client events (event names)
export const EVENTS = {
  ROOM_STATE:       'room_state_update',
  PLAYER_KICKED:    'player_kicked',
  GUESS_RESULT:     'guess_result',
  ACTIVITY_FEED:    'activity_feed',
  ROUND_START:      'round_start',
  ROUND_END:        'round_end',
  LEVEL_END:        'level_end',
  GAME_OVER:        'game_over',
  IMAGE_DATA:       'image_data',
  ERROR:            'server_error',
  ROOM_NOT_FOUND:   'room_not_found',
} as const;
