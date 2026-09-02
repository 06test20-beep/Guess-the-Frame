import { describe, it, expect } from 'vitest';
import { selectNextJudge } from './judgeRotation';
import type { Player } from '../types';

describe('judgeRotation', () => {
  const createPlayers = (count: number): Player[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      score: 0,
      avatarId: 1,
    }));
  };

  it('throws if no players are provided', () => {
    expect(() => selectNextJudge([], [])).toThrow('No players available');
  });

  it('returns the only player if only 1 is available', () => {
    const players = createPlayers(1);
    expect(selectNextJudge(players, []).id).toBe('p1');
    expect(selectNextJudge(players, ['p1']).id).toBe('p1');
  });

  it('alternates perfectly between 2 players', () => {
    const players = createPlayers(2); // p1, p2
    
    // Step 1: No history, should pick one of them
    const judge1 = selectNextJudge(players, []);
    expect(['p1', 'p2']).toContain(judge1.id);
    
    // Step 2: History has judge1, MUST pick judge2
    const judge2 = selectNextJudge(players, [judge1.id]);
    expect(judge2.id).not.toBe(judge1.id);
    expect(['p1', 'p2']).toContain(judge2.id);

    // Step 3: History has judge1, judge2. Cycle resets!
    let history: string[] = [];
    for (let i = 0; i < 10; i++) {
      const next = selectNextJudge(players, history);
      if (history.length > 0) {
        // The next judge must NOT be the immediate last judge!
        expect(next.id).not.toBe(history[history.length - 1]);
      }
      history.push(next.id);
    }
  });

  it('rotates perfectly among 3 players without repeating', () => {
    const players = createPlayers(3); // p1, p2, p3
    let history: string[] = [];
    
    // Ensure no back-to-back repeats over 20 iterations
    for (let i = 0; i < 20; i++) {
      const next = selectNextJudge(players, history);
      
      // In a 3-player game, the history window of the last 2 players must NOT contain the next judge
      if (history.length >= 2) {
        const lastTwo = history.slice(-2);
        expect(lastTwo).not.toContain(next.id);
      }
      history.push(next.id);
    }
  });

  it('rotates perfectly among 5 players without repeating', () => {
    const players = createPlayers(5);
    let history: string[] = [];

    for (let i = 0; i < 30; i++) {
      const next = selectNextJudge(players, history);
      
      // In a 5-player game, the history window of the last 4 players must NOT contain the next judge
      if (history.length >= 4) {
        const lastFour = history.slice(-4);
        expect(lastFour).not.toContain(next.id);
      }
      history.push(next.id);
    }
  });
});
