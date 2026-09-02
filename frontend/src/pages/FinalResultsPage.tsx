import React, { useMemo, useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { AVATARS } from '../constants/game';
import Confetti from '../components/Confetti';
import SoundToggle from '../components/SoundToggle';

function TallyScore({ targetScore }: { targetScore: number }) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setScore(Math.floor(easeProgress * targetScore));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [targetScore]);

  return <>{score}</>;
}

export default function FinalResultsPage() {
  const { players, resetGame } = useGameStore();

  // Rank players by score
  const ranked = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    let rankVal = 1;
    return sorted.map((p, i, arr) => {
      if (i > 0 && p.score < arr[i - 1].score) rankVal = i + 1;
      return { ...p, rank: rankVal };
    });
  }, [players]);

  const first  = ranked.filter(p => p.rank === 1);
  const second = ranked.filter(p => p.rank === 2);
  const third  = ranked.filter(p => p.rank === 3);

  const winner = first[0];
  const winnerAvatar = winner ? AVATARS.find(a => a.id === winner.avatarId) : null;
  const p2 = second[0];
  const p2Av = p2 ? AVATARS.find(a => a.id === p2.avatarId) : null;
  const p3 = third[0];
  const p3Av = p3 ? AVATARS.find(a => a.id === p3.avatarId) : null;

  return (
    <div className="final-bg">
      <Confetti />

      {/* GAME OVER title */}
      <h1 className="final-title anim-fade">
        <span>GAME </span>
        <span>OVER</span>
      </h1>

      {/* 1st place badge */}
      {winner && (
        <div className="winner-badge anim-slide" style={{ animationDelay:'0.1s', position:'relative', zIndex:1 }}>
          🥇 1ST PLACE
        </div>
      )}

      {/* Podium */}
      <div className="podium-wrap anim-slide" style={{ animationDelay:'0.2s' }}>
        {/* 2nd */}
        {p2 ? (
          <div className="podium-player">
            <div className="podium-avatar" style={{ background: p2Av?.bgGradient }}><img src={p2Av?.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} /></div>
            <div className="podium-name">{p2.name}</div>
            <div className="podium-pts podium-pts--2"><TallyScore targetScore={p2.score} /> pts</div>
            <div className="podium-block podium-block--2">2</div>
          </div>
        ) : <div style={{ width: 100 }} />}

        {/* 1st — center + tallest */}
        {winner && (
          <div className="podium-player">
            <div className="winner-trophy">🏆</div>
            <div className="podium-avatar" style={{
              background: winnerAvatar?.bgGradient,
              width: 80, height: 80, fontSize: '2.4rem',
              border: '4px solid #F4A535',
            }}><img src={winnerAvatar?.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} /></div>
            <div className="podium-name" style={{ fontWeight:900 }}>{winner.name}</div>
            <div className="podium-pts podium-pts--1" style={{ fontSize:'1.1rem' }}><TallyScore targetScore={winner.score} /> pts</div>
            <div className="podium-block podium-block--1">1</div>
          </div>
        )}

        {/* 3rd */}
        {p3 ? (
          <div className="podium-player">
            <div className="podium-avatar" style={{ background: p3Av?.bgGradient }}><img src={p3Av?.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} /></div>
            <div className="podium-name">{p3.name}</div>
            <div className="podium-pts podium-pts--3"><TallyScore targetScore={p3.score} /> pts</div>
            <div className="podium-block podium-block--3">3</div>
          </div>
        ) : <div style={{ width: 100 }} />}
      </div>

      {/* Bottom panels */}
      <div className="final-bottom anim-slide" style={{ animationDelay:'0.3s' }}>
        {/* Message */}
        <div className="final-panel">
          <div className="final-panel__title">💬 MESSAGE</div>
          <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
            Umeed hai aap sabko game pasand aaya hoga!
            Milte hain agle round mein — lekin pehle ek
            selfie toh banta hai yaar! 📸
          </p>
        </div>

        {/* Final Standings */}
        <div className="final-panel">
          <div className="final-panel__title">📊 Final Standings</div>
          {ranked.map((p, i) => {
            const av = AVATARS.find(a => a.id === p.avatarId);
            return (
              <div key={p.id} className={`standings-row ${p.rank === 1 ? 'standings-row--1' : ''}`}>
                <span className="standings-row__rank">
                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
                </span>
                <div className="standings-row__avatar" style={{ background: av?.bgGradient }}>
                  <img src={av?.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
                </div>
                <span className="standings-row__name">{p.name}</span>
                <span className="standings-row__score">{p.score}</span>
              </div>
            );
          })}
        </div>

        {/* New game + credits */}
        <div className="final-panel" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="final-panel__title">🎬 FRAMES BY</div>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', lineHeight:1.6 }}>
            Add your frame credits here after loading your images!
          </p>
          <div style={{ flex:1 }} />
          <button
            id="new-game-btn"
            className="btn-primary"
            style={{ width:'100%', fontSize:'0.95rem' }}
            onClick={resetGame}
          >
            🔄 Play Again
          </button>
        </div>
      </div>

      <SoundToggle />
    </div>
  );
}
