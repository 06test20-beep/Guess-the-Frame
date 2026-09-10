import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import { LEVELS } from '../constants/game';
import type { LevelId } from '../types';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';
import { useOnlineGameStore } from '../store/onlineGameStore';

export default function PlayingSequencePage() {
  const { phase, setPhase, setSelectedGames } = useGameStore();
  const { roomCode, socket, hostId } = useOnlineGameStore();
  const { playNavClick, playStartGame } = useSound();

  const [selected, setSelected] = useState<LevelId[]>([]);

  // Max slots is 4
  const slots = Array.from({ length: 4 }, (_, i) => selected[i] || null);

  const handleAddGame = (id: LevelId) => {
    if (selected.includes(id)) return;
    if (selected.length >= 4) return;
    playNavClick();
    setSelected([...selected, id]);
  };

  const handleRemoveGame = (id: LevelId) => {
    playNavClick();
    setSelected(selected.filter(g => g !== id));
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    playStartGame();
    setSelectedGames(selected);
    
    if (roomCode) {
      // If we are online, just go back to the lobby, the host has set the games in gameStore.
      // We will upload them to the server when they actually hit "Start Game" in the lobby.
      setPhase('online-lobby');
    } else {
      setPhase('level-intro');
    }
  };

  const availableGames = Object.values(LEVELS);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      /* Background removed so it inherits global body texture/colors */
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      color: '#fff',
      fontFamily: "'Nunito', sans-serif"
    }}>
      <style>{`
        .seq-slot {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .seq-slot::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 255, 255,0.2) 0%, transparent 100%);
          pointer-events: none;
        }
        .seq-slot.filled {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.4);
        }
        .seq-slot.filled:hover {
          transform: translateY(-4px);
          border-color: #fff;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.5);
        }
        
        .seq-card {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .seq-card:not(.added):hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(155, 89, 182, 0.4);
        }
        .seq-card.added {
          background: rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.05);
          opacity: 0.7;
          cursor: default;
        }
        .seq-card-icon {
          position: absolute;
          top: -15px;
          right: -15px;
          font-size: 80px;
          opacity: 0.1;
          transform: rotate(15deg);
          pointer-events: none;
          transition: all 0.3s;
          color: #fff;
        }
        .seq-card:hover .seq-card-icon {
          transform: rotate(0deg) scale(1.1);
          opacity: 0.2;
        }
        
        .confirm-btn {
          background: #fff;
          color: #FF6EB4;
          border: none;
          padding: 16px 40px;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: all 0.3s;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          color: #9B59B6;
        }
        .confirm-btn:disabled {
          background: rgba(255, 255, 255,0.3);
          color: rgba(255, 255, 255,0.6);
          box-shadow: none;
          cursor: not-allowed;
        }
      `}</style>
      
      <div className="anim-fade" style={{ 
        maxWidth: '1000px', width: '100%', 
        // Inner layout pink gradient
        background: 'linear-gradient(135deg, #FF6EB4 0%, #9B59B6 100%)', 
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255,0.4)',
        // Drop shadow with pink glow
        boxShadow: '0 24px 80px rgba(255, 110, 180, 0.45)',
        padding: '50px',
        margin: 'auto'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <div style={{ 
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              Custom Match
            </div>
            <h1 style={{ 
              fontFamily: "'Poppins', sans-serif", 
              fontSize: '2.5rem', 
              fontWeight: 900,
              margin: '0 0 8px 0',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
              lineHeight: 1.2
            }}>
              Build Your Playing Sequence
            </h1>
            <p style={{ color: 'rgba(255, 255, 255,0.9)', fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>
              Pick exactly 4 games to curate your custom experience.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255,0.15)', 
            padding: '16px 24px', 
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255,0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              lineHeight: 1,
              color: '#fff',
              textShadow: selected.length === 4 ? '0 0 20px rgba(255, 255, 255, 0.8)' : '0 2px 10px rgba(0,0,0,0.1)',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.3s'
            }}>
              {selected.length}<span style={{ fontSize: '1.5rem', opacity: 0.6, textShadow: 'none' }}>/4</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255, 255, 255,0.8)', marginTop: '8px' }}>
              Selected
            </div>
          </div>
        </div>

        {/* ── Playing Order Slots ── */}
        <div>
          <h2 style={{ 
            fontSize: '1rem', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            color: 'rgba(255, 255, 255,0.8)', 
            fontWeight: 800,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            Playing Order <div style={{ height: '1.5px', flex: 1, background: 'rgba(255, 255, 255,0.3)' }}></div>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {slots.map((gameId, idx) => {
              const game = gameId ? LEVELS[gameId] : null;
              return (
                <div key={`slot-${idx}`} className={`seq-slot ${game ? 'filled' : ''}`}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '2px', 
                    color: '#fff', 
                    fontWeight: 800, 
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    Round {idx + 1}
                    {game && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255, 255, 255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        {game.icon}
                      </div>
                    )}
                  </div>
                  
                  {game ? (
                    <>
                      <div style={{ 
                        position: 'absolute', right: '10px', bottom: '-10px', fontSize: '6rem', 
                        fontWeight: 900, opacity: 0.15, pointerEvents: 'none', fontFamily: "'Poppins', sans-serif"
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: "'Poppins', sans-serif", lineHeight: 1.2, marginBottom: '6px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {game.title}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255,0.9)', fontWeight: 700 }}>
                        {game.subtitle}
                      </div>
                      <button
                        onClick={() => handleRemoveGame(gameId)}
                        style={{
                          position: 'absolute', top: '12px', right: '12px',
                          background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff',
                          width: '28px', height: '28px', borderRadius: '50%',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', fontWeight: 800, transition: 'all 0.2s',
                          backdropFilter: 'blur(4px)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.7 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, marginBottom: '12px', fontFamily: "'Poppins', sans-serif" }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '1px' }}>Blank Slot</div>
                      <div style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '6px', fontWeight: 600 }}>Tap a card below.</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Available Games ── */}
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ 
            fontSize: '1rem', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            color: 'rgba(255, 255, 255,0.8)', 
            fontWeight: 800,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            Available Games <div style={{ height: '1.5px', flex: 1, background: 'rgba(255, 255, 255,0.3)' }}></div>
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {availableGames.map(game => {
              const isSelected = selected.includes(game.id as LevelId);
              return (
                <div
                  key={game.id}
                  className={`seq-card ${isSelected ? 'added' : ''}`}
                  onClick={() => !isSelected && handleAddGame(game.id as LevelId)}
                >
                  <div className="seq-card-icon">{game.icon}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '10px', 
                      background: 'rgba(255, 255, 255,0.9)', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                      {game.icon}
                    </div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255,0.8)', fontWeight: 800 }}>
                      {game.countdownLabel}
                    </div>
                  </div>
                  
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: "'Poppins', sans-serif", marginBottom: '6px', color: '#fff', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {game.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255,0.9)', fontWeight: 700, marginBottom: '24px' }}>
                    {game.subtitle}
                  </div>
                  
                  <div style={{ 
                    marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'rgba(255, 255, 255,0.2)', padding: '12px 16px', borderRadius: '12px', margin: '0 -4px -4px -4px'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 800, letterSpacing: '1px' }}>
                      {game.rounds} ROUNDS
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', fontWeight: 900, 
                      color: isSelected ? 'rgba(255, 255, 255,0.7)' : '#FF6EB4',
                      background: isSelected ? 'transparent' : '#fff',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      boxShadow: isSelected ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {isSelected ? 'ADDED' : '+ ADD'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginTop: '50px', paddingTop: '30px', borderTop: '1.5px solid rgba(255, 255, 255,0.3)' 
        }}>
          <button 
            onClick={() => { 
              playNavClick(); 
              setPhase(roomCode ? 'online-lobby' : 'player-setup'); 
            }}
            style={{
              background: 'rgba(0,0,0,0.1)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
          >
            ← Back to Setup
          </button>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={selected.length === 0}
          >
            Confirm Selection
          </button>
        </div>
      </div>
      <SoundToggle />
    </div>
  );
}
