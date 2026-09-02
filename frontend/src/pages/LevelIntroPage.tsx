import React, { useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { LEVELS } from '../constants/game';
import SoundToggle from '../components/SoundToggle';

export default function LevelIntroPage() {
  const { currentLevel, selectJudge, setPhase } = useGameStore();
  const level = LEVELS[currentLevel];

  // Dot progress indicator
  const dots = [1, 2, 3, 4];

  return (
    <div className="page-full">
      <div className="landing-bg__orb landing-bg__orb--1" style={{ opacity: 0.2 }} />
      <div className="landing-bg__orb landing-bg__orb--2" style={{ opacity: 0.2 }} />

      <div className="level-intro-card anim-fade">
        {/* Level icon */}
        <div className="level-intro-icon" style={{ background: level.iconBg }}>
          {level.icon}
        </div>

        {/* Title */}
        <h1 className="level-intro-title">{level.title}</h1>
        <p className="level-intro-subtitle">{level.subtitle}</p>

        {/* Round badge */}
        <div className="level-intro-rounds">
          <span>{level.rounds}</span> ROUNDS
        </div>

        <div className="level-intro-label">GET READY</div>

        {/* Level progress dots */}
        <div className="level-intro-dots">
          {dots.map(d => (
            <div
              key={d}
              className={[
                'level-dot',
                d === currentLevel ? 'level-dot--active' : '',
                d < currentLevel  ? 'level-dot--done'   : '',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Start button */}
        <button
          id="select-judge-btn"
          className="btn-primary"
          style={{ marginTop: 8, fontSize:'1rem', padding:'14px 40px' }}
          onClick={selectJudge}
        >
          ⚖️ Select Judge & Begin
        </button>
      </div>

      <SoundToggle />
    </div>
  );
}
