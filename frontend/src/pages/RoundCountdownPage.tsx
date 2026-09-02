import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useSound } from '../hooks/useSound';
import { Volume2, VolumeX } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';

export default function RoundCountdownPage() {
  const { currentRound, enterGameplay } = useGameStore();
  const { playNavClick } = useSound();
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    // 3.. 2.. 1..
    const timer1 = setTimeout(() => { setCount(2); playNavClick(); }, 1000);
    const timer2 = setTimeout(() => { setCount(1); playNavClick(); }, 2000);
    const timer3 = setTimeout(() => { enterGameplay(); }, 3000);

    // Initial pop sound
    playNavClick();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [enterGameplay, playNavClick]);

  return (
    <div 
      className="page-full" 
      style={{ 
        background: 'radial-gradient(circle at center, #ffe6f0 0%, #fce7f3 50%, #fad1e8 100%)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      {/* Mute button from screenshot is handled by SoundToggle, but we can position it */}
      <div style={{ position: 'absolute', bottom: 24, left: 24 }}>
        <SoundToggle />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        
        {/* ROUND Pill */}
        <div style={{
          background: 'rgba(236, 72, 153, 0.1)',
          color: '#ec4899',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 800,
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          ROUND {currentRound}
        </div>

        {/* Center Circle & Number */}
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Pink glow behind circle */}
          <div style={{
            position: 'absolute',
            width: 240, height: 240,
            borderRadius: '50%',
            background: '#ff69b4',
            filter: 'blur(40px)',
            opacity: 0.2
          }} />
          
          <div style={{
            position: 'relative',
            width: 180, height: 180,
            background: '#ffffff',
            borderRadius: '50%',
            boxShadow: '0 10px 40px rgba(236, 72, 153, 0.15), inset 0 -4px 10px rgba(0,0,0,0.02)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={count}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  fontSize: '6rem',
                  fontWeight: 900,
                  color: '#f472b6', // soft pink number
                  lineHeight: 1,
                  textShadow: '0 2px 4px rgba(244, 114, 182, 0.2)'
                }}
              >
                {count}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* EYES ON SCREEN Pill */}
        <div style={{
          background: '#ffffff',
          color: '#c084fc', // purple text
          padding: '10px 24px',
          borderRadius: '30px',
          fontSize: '0.85rem',
          fontWeight: 800,
          letterSpacing: '1px',
          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.1)',
          marginTop: '10px'
        }}>
          EYES ON SCREEN!
        </div>

        {/* Bouncing Dots */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
              style={{
                width: '10px', height: '10px',
                borderRadius: '50%',
                background: '#f472b6',
                opacity: 0.6
              }}
            />
          ))}
        </div>
        
      </div>
    </div>
  );
}
