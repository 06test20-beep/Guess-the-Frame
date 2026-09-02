import type { Player } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
//  Fair, non-repeating judge rotation.
//  Guarantees no player is selected again until all eligible players have
//  had a turn. Works correctly for any player count.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pick the next judge from `players` while avoiding recent repeats.
 *
 * @param players     All players in the game.
 * @param judgeHistory Array of player IDs that have already been judge (in order).
 * @returns The player chosen as next judge.
 */
export function selectNextJudge(
  players: Player[],
  judgeHistory: string[]
): Player {
  if (players.length === 0) throw new Error('No players available');
  if (players.length === 1) return players[0];

  // Players who haven't been judge yet in this rotation cycle
  const alreadyJudged = new Set(judgeHistory.slice(-(players.length - 1)));
  const eligible = players.filter(p => !alreadyJudged.has(p.id));

  // If everyone has gone (or we exhausted the list), reset and pick any
  const pool = eligible.length > 0 ? eligible : players;

  // Shuffle the eligible pool for randomness
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled[0];
}
