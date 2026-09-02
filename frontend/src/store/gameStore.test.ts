/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import useGameStore from './gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset state before each test
    useGameStore.setState({
      players: [
        { id: 'p1', name: 'Alice', score: 0, avatarId: 1 },
        { id: 'p2', name: 'Bob', score: 0, avatarId: 2 },
        { id: 'p3', name: 'Charlie', score: 0, avatarId: 3 }
      ],
      currentJudgeId: 'p1',
      judgeHistory: ['p1'],
      currentLevel: 1,
      currentRound: 1,
      phase: 'gameplay',
      timeRemaining: 30,
      timerRunning: true,
      imageRevealed: false,
      answerRevealed: false,
      lastScoreAction: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Timer Behavior', () => {
    it('ticks down by 1 each second', () => {
      const { tickTimer } = useGameStore.getState();
      expect(useGameStore.getState().timeRemaining).toBe(30);
      
      tickTimer();
      expect(useGameStore.getState().timeRemaining).toBe(29);
    });

    it('stops at 00:00 and does NOT advance automatically', () => {
      const { tickTimer } = useGameStore.getState();
      useGameStore.setState({ timeRemaining: 1 });
      
      tickTimer();
      expect(useGameStore.getState().timeRemaining).toBe(0);
      expect(useGameStore.getState().timerRunning).toBe(false);
      expect(useGameStore.getState().phase).toBe('gameplay'); // Stays on gameplay!
    });
  });

  describe('Scoring Logic', () => {
    it('awards +10 for correct answer', () => {
      const { awardCorrect } = useGameStore.getState();
      awardCorrect('p2');
      
      const p2 = useGameStore.getState().players.find(p => p.id === 'p2');
      expect(p2?.score).toBe(10);
      expect(useGameStore.getState().lastScoreAction).toEqual({ playerId: 'p2', points: 10 });
    });

    it('deducts -5 for wrong answer', () => {
      const { awardWrong } = useGameStore.getState();
      awardWrong('p2');
      
      const p2 = useGameStore.getState().players.find(p => p.id === 'p2');
      expect(p2?.score).toBe(-5);
    });

    it('awards +20 for judge bonus WITHOUT -5 penalty', () => {
      const { awardJudgeBonus } = useGameStore.getState();
      awardJudgeBonus();
      
      const judge = useGameStore.getState().players.find(p => p.id === 'p1');
      expect(judge?.score).toBe(20);
      expect(useGameStore.getState().lastScoreAction).toEqual({ playerId: 'p1', points: 20 });
    });
  });

  describe('Undo Logic', () => {
    it('undos a +10 score correctly', () => {
      const { awardCorrect, undoLastScore } = useGameStore.getState();
      awardCorrect('p2');
      expect(useGameStore.getState().players.find(p => p.id === 'p2')?.score).toBe(10);
      
      undoLastScore();
      expect(useGameStore.getState().players.find(p => p.id === 'p2')?.score).toBe(0);
      expect(useGameStore.getState().lastScoreAction).toBeNull();
    });

    it('undos a -5 penalty correctly', () => {
      const { awardWrong, undoLastScore } = useGameStore.getState();
      awardWrong('p2');
      expect(useGameStore.getState().players.find(p => p.id === 'p2')?.score).toBe(-5);
      
      undoLastScore();
      expect(useGameStore.getState().players.find(p => p.id === 'p2')?.score).toBe(0);
    });

    it('undos a +20 judge bonus correctly', () => {
      const { awardJudgeBonus, undoLastScore } = useGameStore.getState();
      awardJudgeBonus();
      expect(useGameStore.getState().players.find(p => p.id === 'p1')?.score).toBe(20);
      
      undoLastScore();
      expect(useGameStore.getState().players.find(p => p.id === 'p1')?.score).toBe(0);
    });
  });

  describe('Progression & New Game', () => {
    beforeEach(() => {
      // Mock localStorage for progression tests
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true
      });
    });

    it('preserves score across rounds', () => {
      const { awardCorrect, nextRound } = useGameStore.getState();
      awardCorrect('p2'); // +10
      nextRound(); // advances to round 2

      expect(useGameStore.getState().currentRound).toBe(2);
      expect(useGameStore.getState().players.find(p => p.id === 'p2')?.score).toBe(10);
    });

    it('resetGame wipes players and resets to player-count phase', () => {
      const { awardCorrect, resetGame } = useGameStore.getState();
      awardCorrect('p2');
      useGameStore.setState({ currentLevel: 3, currentRound: 5 });
      
      resetGame();
      
      expect(useGameStore.getState().phase).toBe('player-count');
      expect(useGameStore.getState().currentLevel).toBe(1);
      expect(useGameStore.getState().currentRound).toBe(1);
      expect(useGameStore.getState().players.length).toBe(0); // Players Wiped
    });
  });
});
