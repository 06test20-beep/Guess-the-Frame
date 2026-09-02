import React from 'react';
import { Gavel } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { LEVELS, AVATARS } from '../constants/game';
import { getQuestionsForLevel } from '../utils/questionStorage';

export default function AppHeader() {
  const { phase, currentLevel, currentRound, currentJudgeId, players } = useGameStore();

  const showHeader = ['gameplay','answer-reveal','scoring'].includes(phase);
  if (!showHeader) return null;

  const level     = LEVELS[currentLevel];
  const questions = getQuestionsForLevel(currentLevel);
  const judge     = players.find(p => p.id === currentJudgeId);
  const judgeAvatar = judge ? AVATARS.find(a => a.id === judge.avatarId) : null;

  return (
    <header className="app-header">
      {/* Logo */}
      <div className="app-header__logo">
        <span>Guess</span><span> the Frame</span>
      </div>

      {/* Centre: level + round */}
      <div className="app-header__center">
        <div className="app-header__level-badge">
          <span>{level?.icon}</span>
          <span>{level?.title}</span>
        </div>
        <div className="app-header__round-badge">
          Round {currentRound} / {questions.length}
        </div>
      </div>

      {/* Judge indicator */}
      {judge && (
        <div className="app-header__judge">
          <div
            className="app-header__judge-avatar"
            style={{ background: judgeAvatar?.bgGradient }}
          >
            <img src={judgeAvatar?.imagePath} alt="Judge" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Gavel size={16} /> {judge.name}</span>
          <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>JUDGE</span>
        </div>
      )}
    </header>
  );
}
