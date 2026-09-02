import { useEffect, useCallback } from 'react';
import useGameStore from '../store/gameStore';

/**
 * Judge Keyboard Shortcuts — active only during gameplay phases.
 *
 * Spacebar    → Start / stop the timer
 * Enter       → Reveal answer  (gameplay phase only)
 * R           → Reveal answer  (alias, easier to hit)
 * G           → Who Got It Right? / go to scoring  (answer-reveal phase)
 * N           → Next Round  (answer-reveal phase)
 * 1 – 8       → Award correct points to that player (scoring phase)
 *
 * All shortcuts are suppressed when focus is inside an <input> or <textarea>
 * so typing player names / admin answers is never intercepted.
 */
export function useKeyboardShortcuts() {
  const {
    phase,
    timerRunning,
    players,
    currentJudgeId,
    revealAnswer,
    goToScoring,
    nextRound,
    awardCorrect,
  } = useGameStore();

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Never intercept when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const store = useGameStore.getState();

      switch (e.key) {
        // ── Spacebar → toggle timer ──────────────────────────────────────────
        case ' ':
          e.preventDefault();
          if (store.phase === 'gameplay') {
            // Toggle via store tick trick — just flip timerRunning
            useGameStore.setState({ timerRunning: !store.timerRunning });
          }
          break;

        // ── Enter / R → Reveal Answer ────────────────────────────────────────
        case 'Enter':
        case 'r':
        case 'R':
          if (store.phase === 'gameplay' && !store.answerRevealed) {
            e.preventDefault();
            store.revealAnswer();
          }
          break;

        // ── G → Who Got It Right? (answer-reveal → scoring) ─────────────────
        case 'g':
        case 'G':
          if (store.phase === 'answer-reveal') {
            e.preventDefault();
            store.goToScoring();
          }
          break;

        // ── N → Next Round ───────────────────────────────────────────────────
        case 'n':
        case 'N':
          if (store.phase === 'answer-reveal') {
            e.preventDefault();
            store.nextRound();
          }
          break;

        // ── 1–8 → Award correct to player N (scoring phase) ─────────────────
        default: {
          if (store.phase === 'scoring') {
            const num = parseInt(e.key, 10);
            if (num >= 1 && num <= 8) {
              e.preventDefault();
              const contestants = store.players.filter(p => p.id !== store.currentJudgeId);
              const target = contestants[num - 1];
              if (target) store.awardCorrect(target.id);
            }
          }
        }
      }
    },
    // No dependencies — always reads fresh store state inside handler
    [],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
