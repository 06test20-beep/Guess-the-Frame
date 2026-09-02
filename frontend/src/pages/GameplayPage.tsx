import React, { useState, useEffect, useRef } from 'react';
import { Eye, Film, Keyboard, Undo2, Play, LogOut } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { AVATARS, CORRECT_POINTS, WRONG_POINTS, JUDGE_BONUS } from '../constants/game';
import { getQuestionsForLevel } from '../utils/questionStorage';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import SoundToggle from '../components/SoundToggle';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSound } from '../hooks/useSound';

/* ─── Answer Reveal overlay ──────────────────────────────────────────────── */
function AnswerReveal({ question }: { question: ReturnType<typeof getQuestionsForLevel>[0] }) {
  const { nextRound, phase } = useGameStore();
  const { playReveal } = useSound();

  // Play whoosh on mount
  useEffect(() => { playReveal(); }, []);

  if (question.type === 'eye') {
    return (
      <div className="answer-overlay">
        <div className="eye-reveal-wrap">
          {question.imagePath && (
            <img
              src={question.imagePath}
              alt="Full reveal"
              className="eye-reveal-photo"
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
            />
          )}
          <div className="answer-card anim-3d-flip" style={{ borderRadius: '0 0 20px 20px' }}>
            <span className="answer-card__tag">Answer</span>
            <div className="answer-card__divider" />
            <div className="answer-card__title">{question.answer}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-overlay">
      <div className="answer-card anim-3d-flip">
        <span className="answer-card__tag">Answer</span>
        {question.year && <div className="answer-card__year">{question.year}</div>}
        <div className="answer-card__divider" />
        <div className="answer-card__title">{question.answer}</div>
        {question.type === 'dialogue' && question.hint && (
          <div className="answer-card__sub">"{question.hint}"</div>
        )}
      </div>
    </div>
  );
}

/* ─── Scoring overlay (Who Got It Right?) ────────────────────────────────── */
function ScoringOverlay({ question }: { question: ReturnType<typeof getQuestionsForLevel>[0] }) {
  const { players, currentJudgeId, awardCorrect, awardWrong, awardJudgeBonus, nextRound, adjustScore } = useGameStore();
  const { playCorrect, playWrong } = useSound();
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [pointsApplied, setPointsApplied] = useState(false);

  const contestants = players.filter(p => p.id !== currentJudgeId);

  const handleSelectPlayer = (playerId: string) => {
    if (pointsApplied) return;
    setSelectedId(playerId);
    awardCorrect(playerId);
    playCorrect();
    setPointsApplied(true);
    setTimeout(() => nextRound(), 2000);
  };

  const handleNoOneKnows = () => {
    playWrong();
    nextRound();
  };

  const handleJudgeBonus = () => {
    awardJudgeBonus();
    playCorrect();
    setTimeout(() => nextRound(), 1500);
    setPointsApplied(true);
  };

  return (
    <div className="scoring-overlay anim-fade">
      {/* Correct answer banner */}
      <div className="correct-answer-banner">
        <div className="correct-answer-banner__tag">✓ Correct Answer</div>
        <div className="correct-answer-banner__answer">{question.answer}</div>
        {question.year && <div className="correct-answer-banner__year">{question.year}</div>}
      </div>

      {/* Who got it right */}
      <div className="who-got-it">🎯 Who Got It Right?</div>
      <div className="who-got-it-sub">Click the player who answered correctly (or press their number key)</div>

      {/* Player circles */}
      <div className="scoring-players">
        {contestants.map((p, i) => {
          const av = AVATARS.find(a => a.id === p.avatarId);
          return (
            <button
              key={p.id}
              id={`score-player-${i + 1}`}
              className={`scoring-player-btn ${selectedId === p.id ? 'scoring-player-btn--selected' : ''}`}
              onClick={() => handleSelectPlayer(p.id)}
              disabled={pointsApplied}
            >
              <span className="scoring-player-btn__num">{i + 1}</span>
              {/* Photo or emoji */}
              {p.photoData ? (
                <img
                  src={p.photoData}
                  alt={p.name}
                  className="scoring-player-btn__avatar scoring-player-btn__avatar--photo"
                />
              ) : (
                <div
                  className="scoring-player-btn__avatar"
                  style={{ background: av?.bgGradient }}
                >
                  {av?.emoji}
                </div>
              )}
              <span className="scoring-player-btn__name">{p.name}</span>
            </button>
          );
        })}
      </div>

      {pointsApplied && (
        <div className="points-toast">
          ✓ Points Awarded — Moving to Next Round...
        </div>
      )}

      {!pointsApplied && (
        <div style={{ display:'flex', gap:12 }}>
          <button className="btn-outline" onClick={handleNoOneKnows}>
            ⊘ No One Knows — Skip
          </button>
          <button className="btn-primary" onClick={handleJudgeBonus}>
            ⚖️ +20 Judge Bonus
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Timer sound effect integration ────────────────────────────────────── */
function TimerSounds() {
  const { timeRemaining, timerRunning } = useGameStore();
  const { playTick, playUrgentTick, playTimerEnd } = useSound();
  const prevTime = useRef(timeRemaining);

  useEffect(() => {
    if (!timerRunning) { prevTime.current = timeRemaining; return; }
    if (timeRemaining === prevTime.current) return;
    prevTime.current = timeRemaining;

    if (timeRemaining === 0) {
      playTimerEnd();
    } else if (timeRemaining <= 5) {
      playUrgentTick();
    } else {
      playTick();
    }
  }, [timeRemaining, timerRunning]);

  return null; // renders nothing
}

/* ─── Screen Reader Announcements ────────────────────────────────────────── */
function ScreenReaderAnnouncer({ question }: { question: ReturnType<typeof getQuestionsForLevel>[0] }) {
  const { phase, timeRemaining, timerRunning } = useGameStore();
  const [announcement, setAnnouncement] = useState('');
  const prevTime = useRef(timeRemaining);
  const prevPhase = useRef(phase);

  useEffect(() => {
    // Announce when timer finishes
    if (!timerRunning && timeRemaining === 0 && prevTime.current > 0) {
      setAnnouncement("Time's up!");
    }
    prevTime.current = timeRemaining;

    // Announce when answer is revealed
    if (phase === 'answer-reveal' && prevPhase.current !== 'answer-reveal') {
      setAnnouncement(`The answer is revealed: ${question.answer}.`);
    }
    prevPhase.current = phase;
  }, [phase, timeRemaining, timerRunning, question]);

  return (
    <div aria-live="polite" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
      {announcement}
    </div>
  );
}

/* ─── Main Gameplay Page ─────────────────────────────────────────────────── */
export default function GameplayPage() {
  const { 
    currentLevel, currentRound, phase, answerRevealed, lastScoreAction, 
    undoLastScore, quitGame, imageRevealed, revealImage 
  } = useGameStore();
  const questions = getQuestionsForLevel(currentLevel);
  const question  = questions[currentRound - 1];
  const { playNavClick } = useSound();

  const [isPaused, setIsPaused] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Undo toast logic
  useEffect(() => {
    if (lastScoreAction) {
      setShowUndo(true);
      const t = setTimeout(() => setShowUndo(false), 4000);
      return () => clearTimeout(t);
    } else {
      setShowUndo(false);
    }
  }, [lastScoreAction]);

  // Pause menu logic
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPaused(p => !p);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // ── Feature integrations ──────────────────────────────────────────────────
  useKeyboardShortcuts();

  if (!question) return null;

  /* ── Render question content ── */
  const renderContent = () => {
    // Frame / Eye — image
    if (question.type === 'frame' || question.type === 'eye') {
      return question.imagePath ? (
        <div style={{ 
          position: 'relative', width: '100%', height: '100%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          background: '#000', border: '4px solid rgba(255,255,255,0.1)'
        }}>
          <img
            className={`gameplay-image ${(phase === 'answer-reveal' || phase === 'scoring') ? 'image-unblur' : ''}`}
            src={question.imagePath}
            alt="Guess the movie frame"
            style={{ 
              filter: !imageRevealed ? 'blur(25px)' : 'blur(0)',
              transform: !imageRevealed ? 'scale(1.1)' : 'scale(1)',
              transition: 'filter 0.5s ease-out, transform 0.5s ease-out'
            }}
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.classList.add('gameplay-image-placeholder');
            }}
          />
          {!imageRevealed && (
            <button 
              className="btn-primary" 
              style={{ position: 'absolute', zIndex: 10, fontSize: '1.5rem', padding: '16px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}
              onClick={() => { playNavClick(); revealImage(); }}
            >
              <Eye size={28} /> Reveal Image
            </button>
          )}
        </div>
      ) : (
        <div className="gameplay-image-placeholder">
          <div style={{ color: 'var(--primary)', opacity: 0.8 }}>
            {question.type === 'eye' ? <Eye size={80} strokeWidth={1.5} /> : <Film size={80} strokeWidth={1.5} />}
          </div>
          <p style={{ fontSize:'0.9rem', fontWeight:700 }}>
            Drop image in<br />
            <code style={{ fontSize:'0.75rem' }}>public/assets/levels/level-{currentLevel}-*/q{String(currentRound).padStart(2,'0')}.jpg</code>
          </p>
        </div>
      );
    }

    // Dialogue — text bubble
    if (question.type === 'dialogue') {
      return (
        <div className="gameplay-dialogue-card" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <div className="dialogue-bubble" style={{
            filter: !imageRevealed ? 'blur(15px)' : 'blur(0)',
            transform: !imageRevealed ? 'scale(0.95)' : 'scale(1)',
            transition: 'filter 0.5s ease-out, transform 0.5s ease-out, opacity 0.5s',
            opacity: !imageRevealed ? 0.5 : 1,
            pointerEvents: !imageRevealed ? 'none' : 'auto'
          }}>
            <div className="dialogue-bubble__quote">"</div>
            <div className="dialogue-bubble__text">{question.dialogue}</div>
            <span className="dialogue-bubble__hint">GUESS THE MOVIE / SHOW</span>
          </div>

          {!imageRevealed && (
            <button 
              className="btn-primary" 
              style={{ position: 'absolute', zIndex: 10, fontSize: '1.5rem', padding: '16px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}
              onClick={() => { playNavClick(); revealImage(); }}
            >
              <Eye size={28} /> Reveal Dialogue
            </button>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <AppHeader />
      <TimerSounds />
      <ScreenReaderAnnouncer question={question} />

      <div className="gameplay-layout">
        {/* Main content area */}
        <div className="gameplay-main">
          {renderContent()}

          {/* Answer Reveal overlay */}
          {phase === 'answer-reveal' && <AnswerReveal question={question} />}

          {/* Scoring overlay */}
          {phase === 'scoring' && <ScoringOverlay question={question} />}
        </div>

        {/* Right sidebar */}
        <Sidebar />
      </div>

      <SoundToggle />

      {/* Keyboard shortcut legend toggle */}
      <button
        onClick={() => setShowLegend(p => !p)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 64,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: showLegend ? 'var(--glass-bg)' : 'rgba(255,255,255,0.1)',
          border: '1px solid var(--glass-border)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100,
          transition: 'all 0.2s ease',
        }}
        title="Toggle Keyboard Shortcuts"
      >
        <Keyboard size={20} color={showLegend ? 'var(--primary)' : '#fff'} />
      </button>

      {/* Keyboard shortcut legend panel */}
      {showLegend && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: 110,
            fontSize: '0.75rem',
            color: 'var(--text-main)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid var(--primary)',
            padding: '8px 16px',
            borderRadius: '16px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div><Keyboard size={16} color="var(--primary)" style={{ verticalAlign: 'middle', marginBottom: '2px', marginRight: '4px' }} /> <strong style={{ color: 'var(--primary)' }}>Space</strong> Start/Pause</div>
          <div><strong style={{ color: 'var(--primary)' }}>R</strong> Reveal &nbsp;·&nbsp; <strong style={{ color: 'var(--primary)' }}>G</strong> Scoring &nbsp;·&nbsp; <strong style={{ color: 'var(--primary)' }}>N</strong> Next</div>
          <div><strong style={{ color: 'var(--primary)' }}>1–{Math.max(1, useGameStore.getState().players.filter(p => p.id !== useGameStore.getState().currentJudgeId).length)}</strong> Award Player &nbsp;·&nbsp; <strong style={{ color: 'var(--primary)' }}>Esc</strong> Pause</div>
        </div>
      )}

      {/* Undo Toast */}
      {showUndo && lastScoreAction && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-main)', color: '#fff', padding: '12px 24px',
          borderRadius: '30px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span>
            {lastScoreAction.points > 0 ? 'Added' : 'Subtracted'} {Math.abs(lastScoreAction.points)} points.
          </span>
          <button 
            onClick={() => { playNavClick(); undoLastScore(); setShowUndo(false); }}
            style={{ 
              background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', 
              padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Undo2 size={16} /> Undo
          </button>
        </div>
      )}

      {/* Pause Modal */}
      {isPaused && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: 'var(--bg-main)', padding: '40px', borderRadius: '24px',
            textAlign: 'center', minWidth: '320px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Game Paused</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { playNavClick(); setIsPaused(false); }}>
                <Play size={20} /> Resume Game
              </button>
              <button 
                className="btn-ghost" 
                onClick={() => { playNavClick(); quitGame(); }}
                style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogOut size={20} /> Quit to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
