import { create } from 'zustand';
import type { GameStore, GamePhase, Player, LevelId } from '../types';
import { CORRECT_POINTS, WRONG_POINTS, JUDGE_BONUS, TIMER_SECONDS, TOTAL_LEVELS } from '../constants/game';
import { selectNextJudge } from '../utils/judgeRotation';
import { getQuestionsForLevel } from '../utils/questionStorage';

// ─────────────────────────────────────────────────────────────────────────────
//  Central game store (Zustand)
// ─────────────────────────────────────────────────────────────────────────────

const useGameStore = create<GameStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  phase:           'landing',
  players:         [],
  playerCount:     4,
  currentLevel:    1,
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

  // ── Game flow ──────────────────────────────────────────────────────────────

  /** Called when entering a level — just changes phase; judge selected separately */
  startLevel: () => set({ phase: 'level-intro' }),

  selectJudge: () => {
    const { players, judgeHistory } = get();
    // Contestants only (exclude current judge if re-selected mid-game)
    const next = selectNextJudge(players, judgeHistory);
    set({
      currentJudgeId: next.id,
      judgeHistory:   [...judgeHistory, next.id],
      phase:          'judge-selection',
    });
  },

  startRound: () => {
    set({
      phase:          'round-countdown',
      imageRevealed:  false,
      answerRevealed: false,
      timerRunning:   false,
      timeRemaining:  TIMER_SECONDS,
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
    const { currentRound, currentLevel } = get();
    const levelQuestions = getQuestionsForLevel(currentLevel);

    if (currentRound >= levelQuestions.length) {
      // Level complete
      if (currentLevel >= TOTAL_LEVELS) {
        set({ phase: 'final-results' });
      } else {
        set({
          currentLevel: (currentLevel + 1) as LevelId,
          currentRound: 1,
          answerRevealed: false,
          timerRunning: false,
          timeRemaining: TIMER_SECONDS,
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
        timeRemaining:  TIMER_SECONDS,
      });
    }
  },

  skipRound: () => {
    // Skip without revealing — judge decided nobody answered
    const { currentRound, currentLevel } = get();
    const levelQuestions = getQuestionsForLevel(currentLevel);

    if (currentRound >= levelQuestions.length) {
      if (currentLevel >= TOTAL_LEVELS) {
        set({ phase: 'final-results' });
      } else {
        set({
          currentLevel: (currentLevel + 1) as LevelId,
          currentRound: 1,
          answerRevealed: false,
          timerRunning: false,
          timeRemaining: TIMER_SECONDS,
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
        timeRemaining:  TIMER_SECONDS,
      });
    }
  },

  skipLevel: () => {
    // DEV TOOL: instantly skip the current level
    const { currentLevel } = get();
    if (currentLevel >= TOTAL_LEVELS) {
      set({ phase: 'final-results' });
    } else {
      set({
        currentLevel: (currentLevel + 1) as LevelId,
        currentRound: 1,
        answerRevealed: false,
        timerRunning: false,
        timeRemaining: TIMER_SECONDS,
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
      currentLevel: 1,
      currentRound: 1,
      currentJudgeId: null,
      judgeHistory: [],
      answerRevealed: false,
      timerRunning: false,
      timeRemaining: TIMER_SECONDS,
      lastScoreAction: null,
    });
  },

  resetGame: () =>
    set({
      phase:          'player-count',
      players:        [],
      playerCount:    4,
      currentLevel:   1,
      currentRound:   1,
      currentJudgeId: null,
      judgeHistory:   [],
      answerRevealed: false,
      timerRunning:   false,
      timeRemaining:  TIMER_SECONDS,
    }),
}));

export default useGameStore;
