import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film, Eye as EyeIcon, LogOut } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { AVATARS, LEVELS } from '../constants/game';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';
import type { LevelId } from '../types';
import type { ActivityFeedItem, FinalScore, ClientQuestion } from '../types/online';
import { ONLINE_ROUND_DURATION_MS, ONLINE_FIRST_CORRECT_WINDOW_MS } from '../types/online';

// ─── Countdown Timer Hook ─────────────────────────────────────────────────────
function useServerTimer(endTimeMs: number | null, windowMs?: number | null) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pct, setPct] = useState(1);

  useEffect(() => {
    if (!endTimeMs) { setSecondsLeft(0); setPct(0); return; }

    const totalMs = windowMs ? ONLINE_FIRST_CORRECT_WINDOW_MS : ONLINE_ROUND_DURATION_MS;

    const tick = () => {
      const remaining = Math.max(0, endTimeMs - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      setPct(remaining / totalMs);
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endTimeMs, windowMs]);

  return { secondsLeft, pct };
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [items]);

  return (
    <div
      ref={feedRef}
      style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
        padding: '8px 0',
      }}
    >
      {items.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: 16, fontWeight: 600 }}>
          Guesses will appear here...
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '7px 12px',
          borderRadius: 10,
          fontSize: '0.83rem',
          fontWeight: 700,
          background: item.type === 'correct_guess'
            ? 'rgba(34,197,94,0.12)'
            : item.type === 'near_miss'
            ? 'rgba(251,191,36,0.12)'
            : 'rgba(155, 89, 182, 0.05)',
          border: `1px solid ${item.type === 'correct_guess' ? 'rgba(34,197,94,0.25)' : item.type === 'near_miss' ? 'rgba(251,191,36,0.2)' : 'var(--border-soft)'}`,
          color: item.type === 'correct_guess' ? 'var(--green-muted)' : item.type === 'near_miss' ? '#d97706' : 'var(--text-secondary)',
          animation: 'fadeIn 0.25s ease-out',
        }}>
          {item.type === 'correct_guess' && `✅ ${item.playerName} got it! (#${item.position})`}
          {item.type === 'wrong_guess' && `❌ ${item.playerName}: "${item.guess}"`}
          {item.type === 'near_miss' && `🔥 ${item.playerName} is close!`}
        </div>
      ))}
    </div>
  );
}

// ─── Player Score Strip ───────────────────────────────────────────────────────
function PlayerStrip() {
  const { players, myPlayerId } = useOnlineGameStore();
  const sorted = [...players].filter(p => p.connected).sort((a, b) => b.score - a.score);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      {sorted.map((p, rank) => {
        const av = AVATARS.find(a => String(a.id) === String(p.avatarId)) ?? AVATARS[0];
        const isMe = p.id === myPlayerId;
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: isMe ? 'rgba(139,92,246,0.15)' : 'rgba(255, 255, 255,0.6)',
            border: `1.5px solid ${isMe ? 'rgba(139,92,246,0.4)' : 'var(--border-soft)'}`,
            borderRadius: 30, padding: '5px 14px 5px 6px',
            transition: 'all 0.4s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: av.bgGradient, overflow: 'hidden' }}>
                <img src={av.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
              </div>
              {rank === 0 && (
                <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem' }}>👑</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1, color: isMe ? 'var(--purple-deep)' : 'var(--text-primary)' }}>
                {p.name}{isMe ? ' (you)' : ''}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
                {p.score} pts {p.streak > 1 && <span style={{ color: '#f59e0b' }}>🔥{p.streak}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Question Area ────────────────────────────────────────────────────────────
function QuestionArea() {
  const { currentClientQuestion, resolvedImageUrl, resolvedFullImageUrl, roundPhase, revealedAnswer } = useOnlineGameStore();
  const revealed = roundPhase === 'reveal';

  if (!currentClientQuestion) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 700 }}>
        ⏳ Waiting for next question...
      </div>
    );
  }

  const { type, dialogue, hint } = currentClientQuestion;

  if (type === 'dialogue') {
    return (
      <div className="gameplay-dialogue-card" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div className="dialogue-bubble" style={{
          filter: 'none',
          opacity: 1,
          maxWidth: 680,
          width: '100%',
        }}>
          <div className="dialogue-bubble__quote">“</div>
          <div className="dialogue-bubble__text">{dialogue}</div>
          {hint && <span className="dialogue-bubble__hint">{hint}</span>}
        </div>
      </div>
    );
  }

  // Eye question — during reveal show full-face image; during active show crop
  if (type === 'eye') {
    const displayUrl = revealed && resolvedFullImageUrl ? resolvedFullImageUrl : resolvedImageUrl;
    return (
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        background: '#000', border: '4px solid rgba(255,255,255,0.1)'
      }}>
        {displayUrl ? (
          <img
            key={`${currentClientQuestion.id}-${revealed ? 'full' : 'crop'}`}
            src={displayUrl}
            alt={revealed ? 'Full reveal' : 'Guess the eyes'}
            className="gameplay-image"
            style={{
              filter: 'blur(0)',
              transform: 'scale(1)',
              transition: 'opacity 0.5s ease-out',
              objectFit: 'contain',
              maxHeight: '100%',
              width: 'auto',
            }}
          />
        ) : (
          <div className="gameplay-image-placeholder">
            <div style={{ color: 'var(--primary)', opacity: 0.8 }}>
              <EyeIcon size={80} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>Loading image...</p>
          </div>
        )}
      </div>
    );
  }

  // Frame — image with blur effect
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      background: '#000', border: '4px solid rgba(255,255,255,0.1)'
    }}>
      {resolvedImageUrl ? (
        <img
          src={resolvedImageUrl}
          alt="Guess the frame"
          className={`gameplay-image ${revealed ? 'image-unblur' : ''}`}
          style={{
            filter: !revealed ? 'blur(25px)' : 'blur(0)',
            transform: !revealed ? 'scale(1.1)' : 'scale(1)',
            transition: 'filter 0.5s ease-out, transform 0.5s ease-out'
          }}
        />
      ) : (
        <div className="gameplay-image-placeholder">
          <div style={{ color: 'var(--primary)', opacity: 0.8 }}>
            {type === 'eye' ? <EyeIcon size={80} strokeWidth={1.5} /> : <Film size={80} strokeWidth={1.5} />}
          </div>
          <p style={{ fontSize:'0.9rem', fontWeight:700 }}>Loading image...</p>
        </div>
      )}
    </div>
  );
}

// ─── Guess Input ──────────────────────────────────────────────────────────────
function GuessInput() {
  const { submitGuess, myLastGuessResult, roundPhase } = useOnlineGameStore();
  const { playCorrect, playWrong } = useSound();
  const [guess, setGuess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = roundPhase === 'active' || roundPhase === 'first_correct';

  // Auto-focus input when round becomes active
  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  // Sound on result
  useEffect(() => {
    if (!myLastGuessResult) return;
    if (myLastGuessResult.type === 'correct') playCorrect();
    if (myLastGuessResult.type === 'wrong' || myLastGuessResult.type === 'rate_limited') playWrong();
  }, [myLastGuessResult]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed || !isActive) return;
    submitGuess(trimmed);
    setGuess('');
  }, [guess, isActive, submitGuess]);

  const resultColor = myLastGuessResult?.type === 'correct'
    ? 'var(--green-muted)' : myLastGuessResult?.type === 'near_miss'
    ? '#d97706' : '#ef4444';

  return (
    <div style={{ padding: '16px 0 0 0', marginTop: '16px', borderTop: '1px solid var(--border-soft)' }}>
      {/* Feedback message */}
      {myLastGuessResult && myLastGuessResult.type !== 'already_correct' && (
        <div style={{
          padding: '8px 14px', borderRadius: 10, marginBottom: 10,
          background: myLastGuessResult.type === 'correct' ? 'rgba(34,197,94,0.1)' : myLastGuessResult.type === 'near_miss' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.05)',
          border: `1px solid ${resultColor}40`,
          color: resultColor, fontSize: '0.85rem', fontWeight: 800,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {myLastGuessResult.type === 'correct' && `✅ Correct! +${myLastGuessResult.points} pts`}
          {myLastGuessResult.type === 'wrong' && `❌ Wrong! ${myLastGuessResult.points} pts`}
          {myLastGuessResult.type === 'near_miss' && `🔥 Very close! Try again.`}
          {myLastGuessResult.type === 'rate_limited' && `⏱ Slow down a bit!`}
        </div>
      )}

      {myLastGuessResult?.type === 'already_correct' ? (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--green-muted)', fontWeight: 800, textAlign: 'center', fontSize: '0.9rem' }}>
          ✅ You got it! Waiting for others...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            value={guess}
            onChange={e => setGuess(e.target.value)}
            placeholder={isActive ? 'Type your answer and press Enter...' : '⏳ Round not active'}
            disabled={!isActive}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: 50,
              border: `2px solid ${isActive ? 'var(--purple)' : 'var(--border-soft)'}`,
              background: isActive ? 'linear-gradient(135deg, rgba(255, 255, 255,0.9), rgba(248,235,255,0.95))' : 'rgba(255, 255, 255, 0.6)',
              color: 'var(--text-h)',
              fontSize: '1.1rem',
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              outline: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? '0 8px 24px rgba(170,59,255,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)'; e.target.style.boxShadow = '0 8px 30px rgba(170,59,255,0.3)'; }}
            onBlur={e => { e.target.style.borderColor = isActive ? 'var(--purple)' : 'var(--border-soft)'; e.target.style.boxShadow = isActive ? '0 8px 24px rgba(170,59,255,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'; }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!guess.trim() || !isActive}
            style={{ 
              padding: '14px 32px', 
              borderRadius: 50, 
              flexShrink: 0, 
              fontSize: '1.1rem',
              boxShadow: isActive && guess.trim() ? '0 8px 20px rgba(170,59,255,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Final Results ────────────────────────────────────────────────────────────
function FinalResultsOverlay() {
  const { finalScores, awards, leaveRoom } = useOnlineGameStore();
  const setPhase = useGameStore(s => s.setPhase);
  const { playReveal } = useSound();

  useEffect(() => { playReveal(); }, []);

  const medalFor = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--grad-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, overflowY: 'auto',
    }}>
      <div className="glass-card anim-slide" style={{ maxWidth: 640, width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🏆</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--gold), #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Final Results
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontWeight: 700, fontSize: '1.1rem' }}>The scores are in!</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {finalScores.map((p, i) => {
            const av = AVATARS.find(a => String(a.id) === String(p.avatarId)) ?? AVATARS[0];
            const award = awards[p.id];
            return (
              <div key={p.id} className={i === 0 ? 'anim-slide' : ''} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                background: i === 0 ? 'rgba(244,165,53,0.1)' : 'rgba(255, 255, 255,0.5)',
                border: `2px solid ${i === 0 ? 'rgba(244,165,53,0.4)' : 'var(--border-soft)'}`,
                borderRadius: 20,
              }}>
                <div style={{ fontSize: '1.8rem', width: 40, textAlign: 'center', flexShrink: 0 }}>
                  {medalFor(p.rank)}
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: av.bgGradient, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255, 255, 255,0.5)' }}>
                  <img src={av.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{p.name}</div>
                  {award && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 800, marginTop: 2 }}>{award}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: '1.6rem', color: i === 0 ? 'var(--gold)' : 'var(--text-primary)' }}>
                    {p.score}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>points</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
          onClick={() => { leaveRoom(); setPhase('landing'); }}
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  );
}

// ─── Main Online Gameplay Page ────────────────────────────────────────────────
export default function OnlineGameplayPage() {
  const {
    roundPhase, roundEndTimeMs, firstCorrectTimeMs,
    currentClientQuestion, currentLevelId, currentRoundNumber, totalRoundsInLevel,
    activityFeed, roomState, players, myPlayerId, hostId,
    leaveRoom, revealedAnswer,
  } = useOnlineGameStore();
  const setPhase = useGameStore(s => s.setPhase);
  const { playNavClick } = useSound();

  // Server-synchronized countdown
  const activeEndTime = roundPhase === 'first_correct' ? firstCorrectTimeMs : roundEndTimeMs;
  const isInWindow = roundPhase === 'first_correct';
  const { secondsLeft, pct } = useServerTimer(
    roundPhase === 'active' || roundPhase === 'first_correct' ? activeEndTime : null,
    isInWindow ? true : null
  );

  const timerColor = pct > 0.5 ? 'var(--timer-green)' : pct > 0.25 ? 'var(--timer-yellow)' : 'var(--timer-red)';
  const levelMeta = currentLevelId ? LEVELS[currentLevelId] : null;

  if (roomState === 'results') return <FinalResultsOverlay />;

  return (
    <>
      <header className="app-header">
        {/* Logo */}
        <div className="app-header__logo">
          <span>Guess</span><span> the Frame</span>
        </div>

        {/* Centre: level + round + timer */}
        <div className="app-header__center">
          <div className="app-header__level-badge">
            <span>{levelMeta?.icon ?? '🎬'}</span>
            <span>{levelMeta?.title ?? 'Loading...'}</span>
          </div>
          <div className="app-header__round-badge" style={{ position: 'relative' }}>
            Round {currentRoundNumber} / {totalRoundsInLevel}
          </div>
          {(roundPhase === 'active' || roundPhase === 'first_correct') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
              {isInWindow && (
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f59e0b', background: 'rgba(251,191,36,0.15)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(251,191,36,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  5s Window
                </div>
              )}
              <div style={{
                fontSize: '1.4rem', fontWeight: 900, color: timerColor,
                minWidth: 32, textAlign: 'center',
              }}>
                {secondsLeft}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Player strip + Leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PlayerStrip />
          <SoundToggle inline />
          <button className="btn-ghost" onClick={() => { playNavClick(); leaveRoom(); setPhase('landing'); }} style={{ color: 'var(--text-secondary)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="gameplay-layout">
        {/* Main content area */}
        <div className="gameplay-main" style={{ display: 'flex', flexDirection: 'column' }}>
          <QuestionArea />
          
          {/* V1 Answer Reveal Overlay */}
          {roundPhase === 'reveal' && revealedAnswer && (
            <div className="answer-overlay">
              <div className="answer-card anim-3d-flip">
                <span className="answer-card__tag">Answer</span>
                <div className="answer-card__divider" />
                <div className="answer-card__title">{revealedAnswer}</div>
              </div>
            </div>
          )}
          
          <GuessInput />
        </div>

        {/* Right sidebar */}
        <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)' }}>
          {/* Live Feed */}
          <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', background: 'rgba(255, 255, 255,0.5)', border: 'none' }}>
            <div className="sidebar-section__title">
              <span className="sidebar-section__title-dot" />
              Live Feed
            </div>
            <ActivityFeed items={activityFeed} />
          </div>

          {/* Scoreboard */}
          <div className="sidebar-section" style={{ padding: '16px', background: 'rgba(255, 255, 255,0.5)', border: 'none' }}>
            <div className="sidebar-section__title">
              <span className="sidebar-section__title-dot" style={{ background: 'var(--gold)' }} />
              Scoreboard
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {[...players].filter(p => p.connected).sort((a, b) => b.score - a.score).map((p, i) => {
                const isMe = p.id === myPlayerId;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ width: 18, fontSize: '0.75rem', fontWeight: 800, color: i === 0 ? 'var(--gold)' : 'var(--text-muted)', textAlign: 'center' }}>
                      {i === 0 ? '👑' : `${i + 1}.`}
                    </div>
                    <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: isMe ? 900 : 700, color: isMe ? 'var(--purple-deep)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                      {p.streak > 1 && <span style={{ color: '#f59e0b', marginLeft: 4, fontSize: '0.72rem' }}>🔥{p.streak}</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: i === 0 ? 'var(--gold)' : 'var(--text-secondary)', flexShrink: 0 }}>
                      {p.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
