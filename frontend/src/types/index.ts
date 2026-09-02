// ─── Player ────────────────────────────────────────────────────────────────
export interface Avatar {
  id: number;
  emoji: string;
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
export type QuestionType = 'frame' | 'eye' | 'dialogue';
export type LevelId = 1 | 2 | 3 | 4;

export interface Question {
  id: string;
  level: LevelId;
  questionNumber: number;
  type: QuestionType;
  imagePath?: string;        // for frame / eye questions
  dialogue?: string;         // for dialogue questions
  hint?: string;             // optional sub-hint shown in dialogue answer card
  answer: string;
  year?: number;
}

// ─── Level meta ─────────────────────────────────────────────────────────────
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
  | 'admin';

// ─── Store shape ─────────────────────────────────────────────────────────────
export interface GameStore {
  phase: GamePhase;
  players: Player[];
  playerCount: number;

  currentLevel: LevelId;
  currentRound: number;   // 1-indexed within the level (1–10)
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

  // ── Game flow ─────────────────────────────────────────────────────────────
  startLevel: () => void;
  selectJudge: () => void;
  startRound: () => void;
  revealImage: () => void;
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
