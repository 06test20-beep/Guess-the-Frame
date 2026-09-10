import React, { useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { getModeById } from '../utils/modeRegistry';
import { getQuestionsForMode } from '../utils/questionStorage';
import SoundToggle from '../components/SoundToggle';

export default function LevelIntroPage() {
  const { currentModeId, selectJudge, setPhase, selectedModes, currentSelectedGameIndex } = useGameStore();
  const mode = getModeById(currentModeId);
  const modeQuestions = getQuestionsForMode(currentModeId);

  return (
    <div className="page-full">
      <div className="landing-bg__orb landing-bg__orb--1" style={{ opacity: 0.2 }} />
      <div className="landing-bg__orb landing-bg__orb--2" style={{ opacity: 0.2 }} />

      <div className="level-intro-card anim-fade">
        {/* Mode icon */}
        <div className="level-intro-icon" style={{ background: mode?.iconBg }}>
          {mode?.icon}
        </div>

        {/* Title */}
        <h1 className="level-intro-title">{mode?.name}</h1>
        <p className="level-intro-subtitle">{mode?.subtitle}</p>

        {/* Round badge */}
        <div className="level-intro-rounds">
          <span>{modeQuestions.length}</span> ROUNDS
        </div>

        <div className="level-intro-label">GET READY</div>

        {/* Level progress dots */}
        <div className="level-intro-dots">
          {selectedModes.map((modeId, i) => (
            <div
              key={`${modeId}-${i}`}
              className={[
                'level-dot',
                i === currentSelectedGameIndex ? 'level-dot--active' : '',
                i < currentSelectedGameIndex  ? 'level-dot--done'   : '',
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
