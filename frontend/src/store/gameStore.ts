import { create } from 'zustand';
import type { GameStore, GamePhase, Player, LevelId, ModeId } from '../types';
import { CORRECT_POINTS, WRONG_POINTS, JUDGE_BONUS, TIMER_SECONDS, LEVEL_ID_TO_MODE_ID, MODE_ID_TO_LEVEL_ID } from '../constants/game';
import { selectNextJudge } from '../utils/judgeRotation';
import { getQuestionsForMode, getQuestionsForLevel } from '../utils/questionStorage';
import { getModeById } from '../utils/modeRegistry';

// ─────────────────────────────────────────────────────────────────────────────
//  Central game store (Zustand) — V2 with backward-compat V1 aliases
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the timer for a given ModeId from the registry.
 * Falls back to TIMER_SECONDS (30s) if the mode is not found.
 */
function getModeTimerSeconds(modeId: ModeId): number {
  const mode = getModeById(modeId);
  return mode?.timerSeconds ?? TIMER_SECONDS;
}

/** Convert a ModeId to its V1 LevelId (for compat), or 1 if not found. */
function modeIdToLevelId(modeId: ModeId): LevelId {
  const id = MODE_ID_TO_LEVEL_ID[modeId];
  return (id ?? 1) as LevelId;
}

/** Convert a LevelId to its V2 ModeId. */
function levelIdToModeId(level: LevelId): ModeId {
  return LEVEL_ID_TO_MODE_ID[level] ?? String(level);
}

const useGameStore = create<GameStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  phase:           'landing',
  players:         [],
  playerCount:     4,

  // V2
  currentModeId:   'hollywood',
  selectedModes:   [],
  currentSelectedGameIndex: 0,

  // V1 compat aliases (derived from V2 state)
  currentLevel:    1,
  selectedGames:   [],

  currentRound:    1,
  currentJudgeId:  null,
  judgeHistory:    [],
  imageRevealed:   false,
  answerRevealed:  false,
  timerRunning:    false,
  timeRemaining:   TIMER_SECONDS,
  lastScoreAction: null,

  // ── Setup ──────────────────────────────────────────────────────────────────
  setPhase: (phase: GamePhase) => set({ phase }),
  setPlayerCount: (count: number) => set({ playerCount: count }),
  setPlayers: (players: Player[]) => set({ players }),

  /** V2: set selected modes by ModeId array */
  setSelectedModes: (modes: ModeId[]) => {
    if (modes.length === 0) return;
    const firstModeId = modes[0];
    set({
      selectedModes: modes,
      currentModeId: firstModeId,
      currentSelectedGameIndex: 0,
      // V1 compat aliases
      selectedGames: modes.map(m => modeIdToLevelId(m)),
      currentLevel:  modeIdToLevelId(firstModeId),
    });
  },

  /** V1 compat: set selected games by LevelId — converts to ModeId internally */
  setSelectedGames: (games: LevelId[]) => {
    if (games.length === 0) return;
    const modes = games.map(levelIdToModeId);
    set({
      selectedGames: games,
      currentSelectedGameIndex: 0,
      currentLevel: games[0],
      // V2
      selectedModes: modes,
      currentModeId: modes[0],
    });
  },

  // ── Game flow ──────────────────────────────────────────────────────────────

  startLevel: () => set({ phase: 'level-intro' }),

  selectJudge: () => {
    const { players, judgeHistory } = get();
    const next = selectNextJudge(players, judgeHistory);
    set({
      currentJudgeId: next.id,
      judgeHistory:   [...judgeHistory, next.id],
      phase:          'judge-selection',
    });
  },

  startRound: (timerSeconds?: number) => {
    const { currentModeId } = get();
    const timer = timerSeconds ?? getModeTimerSeconds(currentModeId);
    set({
      phase:          'round-countdown',
      imageRevealed:  false,
      answerRevealed: false,
      timerRunning:   false,
      timeRemaining:  timer,
    });
  },

  enterGameplay: () => {
    set({ phase: 'gameplay' });
  },

  revealImage: () => {
    set({
      imageRevealed: true,
      timerRunning: true,
    });
  },

  tickTimer: () => {
    const { timeRemaining, timerRunning } = get();
    if (!timerRunning) return;
    if (timeRemaining <= 1) {
      set({ timeRemaining: 0, timerRunning: false });
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  revealAnswer: () => {
    set({ answerRevealed: true, timerRunning: false, phase: 'answer-reveal' });
  },

  goToScoring: () => {
    set({ phase: 'scoring' });
  },

  nextRound: () => {
    const { currentRound, currentModeId, selectedModes, currentSelectedGameIndex } = get();
    const questions = getQuestionsForMode(currentModeId);
    const timer = getModeTimerSeconds(currentModeId);

    if (currentRound >= questions.length) {
      // Mode complete — move to next selected game
      const nextIndex = currentSelectedGameIndex + 1;
      if (nextIndex >= selectedModes.length) {
        set({ phase: 'final-results' });
      } else {
        const nextModeId = selectedModes[nextIndex];
        const nextTimer = getModeTimerSeconds(nextModeId);
        set({
          currentSelectedGameIndex: nextIndex,
          currentModeId: nextModeId,
          currentLevel: modeIdToLevelId(nextModeId),
          currentRound: 1,
          answerRevealed: false,
          timerRunning: false,
          timeRemaining: nextTimer,
          phase: 'level-intro',
        });
      }
    } else {
      set({
        currentRound:   currentRound + 1,
        phase:          'round-countdown',
        imageRevealed:  false,
        answerRevealed: false,
        timerRunning:   false,
        timeRemaining:  timer,
      });
    }
  },

  skipRound: () => {
    const { currentRound, currentModeId, selectedModes, currentSelectedGameIndex } = get();
    const questions = getQuestionsForMode(currentModeId);
    const timer = getModeTimerSeconds(currentModeId);

    if (currentRound >= questions.length) {
      const nextIndex = currentSelectedGameIndex + 1;
      if (nextIndex >= selectedModes.length) {
        set({ phase: 'final-results' });
      } else {
        const nextModeId = selectedModes[nextIndex];
        const nextTimer = getModeTimerSeconds(nextModeId);
        set({
          currentSelectedGameIndex: nextIndex,
          currentModeId: nextModeId,
          currentLevel: modeIdToLevelId(nextModeId),
          currentRound: 1,
          answerRevealed: false,
          timerRunning: false,
          timeRemaining: nextTimer,
          phase: 'level-intro',
        });
      }
    } else {
      set({
        currentRound:   currentRound + 1,
        phase:          'round-countdown',
        imageRevealed:  false,
        answerRevealed: false,
        timerRunning:   false,
        timeRemaining:  timer,
      });
    }
  },

  skipLevel: () => {
    const { selectedModes, currentSelectedGameIndex } = get();
    const nextIndex = currentSelectedGameIndex + 1;

    if (nextIndex >= selectedModes.length) {
      set({ phase: 'final-results' });
    } else {
      const nextModeId = selectedModes[nextIndex];
      const nextTimer = getModeTimerSeconds(nextModeId);
      set({
        currentSelectedGameIndex: nextIndex,
        currentModeId: nextModeId,
        currentLevel: modeIdToLevelId(nextModeId),
        currentRound: 1,
        answerRevealed: false,
        timerRunning: false,
        timeRemaining: nextTimer,
        phase: 'level-intro',
      });
    }
  },

  // ── Scoring ────────────────────────────────────────────────────────────────

  awardCorrect: (playerId: string) => {
    const { players } = get();
    set({
      players: players.map(p =>
        p.id === playerId ? { ...p, score: p.score + CORRECT_POINTS } : p
      ),
      lastScoreAction: { playerId, points: CORRECT_POINTS },
    });
  },

  awardWrong: (playerId: string) => {
    const { players } = get();
    set({
      players: players.map(p =>
        p.id === playerId ? { ...p, score: p.score + WRONG_POINTS } : p
      ),
      lastScoreAction: { playerId, points: WRONG_POINTS },
    });
  },

  awardJudgeBonus: () => {
    const { players, currentJudgeId } = get();
    if (!currentJudgeId) return;
    set({
      players: players.map(p =>
        p.id === currentJudgeId ? { ...p, score: p.score + JUDGE_BONUS } : p
      ),
      lastScoreAction: { playerId: currentJudgeId, points: JUDGE_BONUS },
    });
  },

  adjustScore: (playerId: string, delta: number) => {
    const { players } = get();
    set({
      players: players.map(p =>
        p.id === playerId ? { ...p, score: p.score + delta } : p
      ),
      lastScoreAction: { playerId, points: delta },
    });
  },

  undoLastScore: () => {
    const { players, lastScoreAction } = get();
    if (!lastScoreAction) return;
    set({
      players: players.map(p =>
        p.id === lastScoreAction.playerId
          ? { ...p, score: p.score - lastScoreAction.points }
          : p
      ),
      lastScoreAction: null,
    });
  },

  // ── Reset & Navigation ────────────────────────────────────────────────────

  quitGame: () => {
    set({
      phase: 'landing',
      currentModeId: 'hollywood',
      currentLevel: 1,
      currentRound: 1,
      currentJudgeId: null,
      judgeHistory: [],
      answerRevealed: false,
      timerRunning: false,
      timeRemaining: TIMER_SECONDS,
      lastScoreAction: null,
      selectedModes: [],
      selectedGames: [],
      currentSelectedGameIndex: 0,
    });
  },

  resetGame: () =>
    set({
      phase:          'player-count',
      players:        [],
      playerCount:    4,
      currentModeId:  'hollywood',
      currentLevel:   1,
      currentRound:   1,
      currentJudgeId: null,
      judgeHistory:   [],
      answerRevealed: false,
      timerRunning:   false,
      timeRemaining:  TIMER_SECONDS,
      selectedModes:  [],
      selectedGames:  [],
      currentSelectedGameIndex: 0,
    }),
}));

export default useGameStore;
