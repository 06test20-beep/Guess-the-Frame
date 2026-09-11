import React, { useState } from 'react';
import { Gavel, LogOut } from 'lucide-react';
import useGameStore from '../store/gameStore';
import { AVATARS } from '../constants/game';
import { getQuestionsForMode } from '../utils/questionStorage';
import { getModeById } from '../utils/modeRegistry';

export default function AppHeader() {
  const { phase, currentModeId, currentRound, currentJudgeId, players, quitGame } = useGameStore();
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const showHeader = ['gameplay','answer-reveal','scoring'].includes(phase);
  if (!showHeader) return null;

  const mode      = getModeById(currentModeId);
  const questions = getQuestionsForMode(currentModeId);
  const judge     = players.find(p => p.id === currentJudgeId);
  const judgeAvatar = judge ? AVATARS.find(a => a.id === judge.avatarId) : null;

  return (
    <header className="app-header">
      {/* Logo */}
      <div 
        className="app-header__logo" 
        onClick={() => setShowLeaveModal(true)}
        style={{ cursor: 'pointer' }}
      >
        <span>Guess</span><span> the Frame</span>
      </div>

      {/* Centre: level + round */}
      <div className="app-header__center">
        <div className="app-header__level-badge">
          <span>{mode?.icon}</span>
          <span>{mode?.name}</span>
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
      {/* Leave Game Modal */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: 'var(--bg-main)', padding: '40px', borderRadius: '24px',
            textAlign: 'center', minWidth: '320px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Leave Game?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-primary" onClick={() => setShowLeaveModal(false)}>
                Stay
              </button>
              <button 
                className="btn-ghost" 
                onClick={() => { setShowLeaveModal(false); quitGame(); }}
                style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogOut size={20} /> Exit to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
