import React from 'react';
import useGameStore from '../store/gameStore';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';

export default function LandingPage() {
  const setPhase = useGameStore(s => s.setPhase);
  const { playNavClick, playStartGame } = useSound();

  return (
    <div className="landing-bg">
      {/* Ambient orbs */}
      <div className="landing-bg__orb landing-bg__orb--1" />
      <div className="landing-bg__orb landing-bg__orb--2" />
      <div className="landing-bg__orb landing-bg__orb--3" />

      <div className="landing-card anim-fade">
        {/* Icon */}
        <div className="landing-icon">🎬</div>

        {/* Title */}
        <h1 className="landing-title">Guess the Frame</h1>
        <p className="landing-subtitle">
          The ultimate offline movie quiz experience
        </p>

        {/* Level pills */}
        <div className="landing-pills">
          <span className="landing-pill">🎬 Bollywood Frames</span>
          <span className="landing-pill">🎬 Hollywood Frames</span>
          <span className="landing-pill">👁️ Guess the Eye</span>
          <span className="landing-pill">💬 Guess the Dialogue</span>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:24, color:'var(--text-muted)', fontSize:'0.85rem', fontWeight:700 }}>
          <span>🎮 4 Levels</span>
          <span>❓ 40 Questions</span>
          <span>🏆 Live Scoring</span>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8, width: '100%', maxWidth: 300 }}>
          <button
            id="landing-start-btn"
            className="btn-primary"
            style={{ fontSize:'1.1rem', padding:'16px 24px', width: '100%' }}
            onClick={() => {
              playStartGame();
              setPhase('player-count');
            }}
          >
            🎉 Local Party
          </button>
          
          <button
            className="btn-gold"
            style={{ fontSize:'1.1rem', padding:'16px 24px', width: '100%' }}
            onClick={() => {
              playNavClick();
              setPhase('online-setup');
            }}
          >
            🌐 Online Multiplayer
          </button>
        </div>

        {/* Admin entry — subtle, at the bottom */}
        <button
          id="open-admin-btn"
          className="btn-ghost"
          style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'-8px' }}
          onClick={() => {
            playNavClick();
            setPhase('admin');
          }}
        >
          ⚙️ Manage Questions
        </button>

        {/* Animated dots */}
        <div className="landing-dots">
          <span className="landing-dot" />
          <span className="landing-dot" />
          <span className="landing-dot" />
        </div>
      </div>

      <SoundToggle />
    </div>
  );
}
