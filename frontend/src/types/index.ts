// ─── Player ────────────────────────────────────────────────────────────────
export interface Avatar {
  id: number;
  imagePath: string;
  bgGradient: string;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  avatarId: number;
  /** Optional base64 selfie / photo uploaded during player setup */
  photoData?: string;
  score: number;
}

// ─── Questions ──────────────────────────────────────────────────────────────
export type QuestionType = 'frame' | 'eye' | 'dialogue' | 'emoji';

/**
 * V1 legacy numeric level ID (still used in default questions.ts and
 * backward-compat code). New code should use ModeId (string) instead.
 */
export type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * V2 stable string-based Mode ID.
 * Built-in modes use slugs like 'hollywood', 'guess-eyes', etc.
 * Custom modes use 'custom_<unique-id>'.
 * Replaces numeric LevelId for all new code.
 */
export type ModeId = string;

export interface Question {
  id: string;
  level: LevelId;    // V1 compat: still populated for built-in modes
  modeId: ModeId;    // V2: stable string identifier
  questionNumber: number;
  type: QuestionType;
  /** Static public-asset path (e.g. /assets/levels/…/q01.jpg). Used by AsyncImage for local gameplay. */
  imagePath?: string;
  /** IndexedDB key (idb://…) or base64 data URL for a custom-uploaded crop image. */
  imageData?: string;
  /** eye questions ONLY — static public-asset path for the full-face reveal image. */
  fullImagePath?: string;
  /** eye questions ONLY — IndexedDB key (idb://…) or base64 data URL for the full-face reveal image. */
  fullImageData?: string;
  dialogue?: string;         // for dialogue questions
  hint?: string;             // optional sub-hint shown in dialogue answer card
  answer: string;
  year?: number;
}

// ─── Game Mode ───────────────────────────────────────────────────────────────

/** Whether a mode is part of the built-in default set or user-created. */
export type ModeSource = 'BUILT_IN' | 'CUSTOM';

/**
 * A Game Mode definition stored in the registry.
 * This is the primary unit of configuration for both local and online games.
 */
export interface GameMode {
  /** Stable string ID — never changes after creation. e.g. 'hollywood', 'custom_abc123' */
  id: ModeId;
  /** Human-readable name shown in UI */
  name: string;
  /** Short description shown in admin/sequence pages */
  description: string;
  /** Template driving the question editor and gameplay renderer */
  templateId: string;   // string (not TemplateId) to allow unknown future templates without import cycle
  /** Whether this mode can be selected for new games */
  enabled: boolean;
  /** Display order in listings — lower numbers appear first */
  order: number;
  /** Whether this is a built-in or user-created mode */
  source: ModeSource;
  /** Timer in seconds for this mode (overrides template default) */
  timerSeconds: number;
  /** Emoji icon displayed in UI */
  icon: string;
  /** CSS gradient background for the icon */
  iconBg: string;
  /** Subtitle shown in card/sequence views */
  subtitle: string;
  /** Countdown label shown before this mode starts (e.g. 'GET READY!') */
  countdownLabel: string;
  /**
   * V1 numeric level ID — present ONLY for built-in modes for backward compat.
   * Used to look up questions in the V1 storage scheme.
   * Undefined for custom modes.
   */
  legacyLevelId?: LevelId;
}

// ─── Level meta (V1 — kept for backward compat) ──────────────────────────────
export interface LevelMeta {
  id: LevelId;
  title: string;
  subtitle: string;
  icon: string;              // emoji icon
  iconBg: string;            // CSS gradient for icon circle
  rounds: number;
  countdownLabel: string;    // e.g. "GET READY!" / "EYES ON SCREEN!"
}

// ─── Game phases ─────────────────────────────────────────────────────────────
export type GamePhase =
  | 'landing'
  | 'player-count'
  | 'player-setup'
  | 'level-intro'
  | 'judge-selection'
  | 'round-countdown'
  | 'gameplay'
  | 'answer-reveal'
  | 'scoring'
  | 'final-results'
  | 'admin'
  | 'online-setup'
  | 'online-lobby'
  | 'online-gameplay'
  | 'playing-sequence';

// ─── Store shape ─────────────────────────────────────────────────────────────
export interface GameStore {
  phase: GamePhase;
  players: Player[];
  playerCount: number;

  /** V2: selected game modes by string ModeId */
  selectedModes: ModeId[];
  currentModeId: ModeId;
  currentSelectedGameIndex: number;

  /** V1 compat aliases — derived from selectedModes/currentModeId for legacy consumers */
  selectedGames: LevelId[];
  currentLevel: LevelId;

  currentRound: number;   // 1-indexed within the mode
  currentJudgeId: string | null;
  judgeHistory: string[]; // IDs of players who've already been judge

  imageRevealed: boolean;
  answerRevealed: boolean;
  timerRunning: boolean;
  timeRemaining: number;  // seconds

  // ── Setup actions ─────────────────────────────────────────────────────────
  setPhase: (phase: GamePhase) => void;
  setPlayerCount: (count: number) => void;
  setPlayers: (players: Player[]) => void;
  /** V2: set selected modes by ModeId */
  setSelectedModes: (modes: ModeId[]) => void;
  /** V1 compat: set selected games by LevelId — converts to ModeId internally */
  setSelectedGames: (games: LevelId[]) => void;

  // ── Game flow ─────────────────────────────────────────────────────────────
  startLevel: () => void;
  selectJudge: () => void;
  startRound: (timerSeconds?: number) => void;
  enterGameplay: () => void;
  revealImage: () => void;
  startRoundTimer: () => void;
  tickTimer: () => void;
  revealAnswer: () => void;
  goToScoring: () => void;
  nextRound: () => void;
  skipRound: () => void;
  skipLevel: () => void;

  // ── Scoring ───────────────────────────────────────────────────────────────
  lastScoreAction: { playerId: string; points: number } | null;
  awardCorrect: (playerId: string) => void;
  awardWrong: (playerId: string) => void;
  awardJudgeBonus: () => void;
  adjustScore: (playerId: string, delta: number) => void;
  undoLastScore: () => void;

  // ── Reset & Navigation ────────────────────────────────────────────────────
  quitGame: () => void;
  resetGame: () => void;
}
