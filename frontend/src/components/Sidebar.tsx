import React from 'react';
import { Search, Ban, Target, Play, FastForward } from 'lucide-react';
import useGameStore from '../store/gameStore';
import TimerRing from './TimerRing';
import PlayerLeaderboardRow from './PlayerLeaderboardRow';
import { CORRECT_POINTS, WRONG_POINTS } from '../constants/game';
import { useSound } from '../hooks/useSound';

export default function Sidebar() {
  const {
    players, currentJudgeId, timeRemaining, timerRunning,
    revealAnswer, goToScoring, nextRound, skipRound, skipLevel, adjustScore, answerRevealed, phase,
    currentRound
  } = useGameStore();
  const { playNavClick } = useSound();

  // Sort by score descending for leaderboard display
  const sorted = [...players].sort((a, b) => b.score - a.score);

  // Assign ranks (tied players get same rank)
  const ranked = sorted.map((p, i, arr) => {
    const rank = i === 0 ? 1 : (p.score === arr[i - 1].score
      ? (arr[i - 1] as any).__rank
      : i + 1);
    (p as any).__rank = rank;
    return { ...p, rank };
  });

  const timerDone = !timerRunning && timeRemaining === 0 && !answerRevealed;
  const progressPercent = ((currentRound - 1) / 10) * 100;

  return (
    <aside className="sidebar">
      {/* Progress Bar */}
      <div style={{ padding: '0 12px', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
          <span>Round {currentRound} of 10</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--purple)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>

      {/* Round Controls header */}
      <div className="sidebar-section">
        <div className="sidebar-section__title" style={{ marginTop: '12px' }}>
          <span className="sidebar-section__title-dot" />
          Round Controls
        </div>

        {/* Timer */}
        <TimerRing />

        {/* Reveal button — only when gameplay active and not revealed */}
        {phase === 'gameplay' && !answerRevealed && (
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: 10, fontSize: '0.82rem', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={revealAnswer}
          >
            <Search size={16} /> Reveal Answer
          </button>
        )}

        {/* No One Knows / Skip — shown when timer is done */}
        {timerDone && phase === 'gameplay' && (
          <button
            className="btn-gold"
            style={{ width: '100%', marginTop: 8, fontSize: '0.8rem', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={skipRound}
          >
            <Ban size={16} /> No One Knows — Skip Round
          </button>
        )}
      </div>

      {/* Leaderboard */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section__title">
          <span className="sidebar-section__title-dot" style={{ background: 'var(--gold)' }} />
          Leaderboard
        </div>

        {ranked.map(p => (
          <PlayerLeaderboardRow
            key={p.id}
            player={p}
            rank={p.rank}
            isJudge={p.id === currentJudgeId}
            onMinus={() => adjustScore(p.id, WRONG_POINTS)}
            onPlus={()  => adjustScore(p.id, CORRECT_POINTS)}
          />
        ))}
      </div>

      {/* Skip / Super Skip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {phase === 'gameplay' && (
          <button className="btn-skip" onClick={() => { playNavClick(); revealAnswer(); }}>
            SKIP
          </button>
        )}
        {phase === 'answer-reveal' && (
          <>
            <button
              id="who-got-it-btn"
              className="btn-primary"
              style={{ width:'100%', fontSize:'0.82rem', padding:'10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => { playNavClick(); goToScoring(); }}
            >
              <Target size={16} /> Who Got It Right?
            </button>
            <button className="btn-skip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { playNavClick(); nextRound(); }}>
              <Play size={16} /> Next Round
            </button>
          </>
        )}
        <button className="btn-skip" onClick={() => { playNavClick(); skipRound(); }}>
          SUPER SKIP
        </button>
        {/* DEV ONLY BUTTON */}
        <button 
          className="btn-skip" 
          onClick={() => { playNavClick(); skipLevel(); }} 
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <FastForward size={16} /> DEV: SKIP LEVEL
        </button>
      </div>
    </aside>
  );
}
