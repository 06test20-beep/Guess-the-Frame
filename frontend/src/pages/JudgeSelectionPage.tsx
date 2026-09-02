import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { AVATARS } from '../constants/game';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';
import { Gavel } from 'lucide-react';

export default function JudgeSelectionPage() {
  const { players, currentJudgeId, startRound } = useGameStore();
  const { playNavClick, playCorrect } = useSound();

  const [isSpinning, setIsSpinning] = useState(true);
  const [displayIndex, setDisplayIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (players.length === 0) return;
    if (!isSpinning) return;

    let tickCount = 0;
    // Spin faster initially, slow down at the end? A constant interval is easier.
    const interval = setInterval(() => {
      setDisplayIndex(prev => (prev + 1) % players.length);
      playNavClick(); // Short click sound
      tickCount++;
      if (tickCount > 12) { // Stop after ~1.8 seconds (12 * 150ms)
        clearInterval(interval);
        setIsSpinning(false);
        const finalIdx = players.findIndex(p => p.id === currentJudgeId);
        setDisplayIndex(finalIdx >= 0 ? finalIdx : 0);
        playCorrect(); // Tada!

        // Auto-advance 1.5 seconds after reveal
        timerRef.current = setTimeout(() => startRound(), 1500);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [players, currentJudgeId, isSpinning, playNavClick, playCorrect, startRound]);

  const displayedPlayer = players[displayIndex];
  const displayedAvatar = displayedPlayer ? AVATARS.find(a => a.id === displayedPlayer.avatarId) : null;

  if (!displayedPlayer) return null;

  return (
    <div className="page-full">
      <div className="landing-bg__orb" style={{
        width:300, height:300, background:'#F4A535',
        top:'-80px', right:'-60px', opacity:0.2,
        position:'absolute', borderRadius:'50%', filter:'blur(60px)',
        animation:'floatOrb 8s ease-in-out infinite',
      }} />

      <motion.div 
        className="judge-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
      >
        {/* Hammer icon */}
        <div className="judge-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Gavel size={32} color="#fff" />
        </div>

        <h2 className="judge-title">
          {isSpinning ? 'Selecting Judge...' : 'Judge Selected!'}
        </h2>

        {/* Judge avatar (animated) */}
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            animate={
              isSpinning 
                ? { scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] } 
                : { scale: 1.1, rotate: 0 }
            }
            transition={
              isSpinning 
                ? { repeat: Infinity, duration: 0.4, ease: "linear" } 
                : { type: 'spring', stiffness: 300, damping: 15 }
            }
            className="judge-avatar-frame" 
            style={{ 
              background: displayedAvatar?.bgGradient, 
              margin: 0, 
              boxShadow: isSpinning ? 'none' : '0 10px 40px rgba(244,165,53,0.4)',
              transformOrigin: 'center center'
            }}
          >
            <div className="judge-avatar-inner">
              <img src={displayedAvatar?.imagePath} alt="Avatar" style={{ width: '80%', height: '80%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
              <span className="judge-avatar-inner__name">{displayedPlayer.name}</span>
            </div>
          </motion.div>
        </div>

        {/* Banner */}
        <AnimatePresence>
          {!isSpinning && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="judge-banner"
            >
              {displayedPlayer.name} is the Judge!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="judge-sub" style={{ opacity: isSpinning ? 0.5 : 1 }}>⏱ Judge serves for 10 rounds</div>

        <AnimatePresence>
          {!isSpinning && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              id="judge-start-btn"
              className="btn-primary"
              style={{ marginTop: 12, fontSize:'0.9rem' }}
              onClick={startRound}
            >
              🎬 Let's Go!
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <SoundToggle />
    </div>
  );
}
