import React from 'react';
import useGameStore from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { AVATARS } from '../constants/game';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';
import type { LevelId } from '../types';

export default function OnlineLobbyPage() {
  const { setPhase, selectedModes } = useGameStore();
  const {
    roomCode, hostId, players, myPlayerId,
    toggleReady, startGame, kickPlayer, error, leaveRoom
  } = useOnlineGameStore();
  const { playNavClick, playStartGame } = useSound();

  const isHost = myPlayerId === hostId;
  const connectedPlayers = players.filter(p => p.connected);
  const allReady = connectedPlayers.length > 0 && connectedPlayers.every(p => p.isReady);

  const handleStart = () => {
    if (!selectedModes.length) return;
    playStartGame();
    startGame(selectedModes);
    setPhase('online-gameplay');
  };

  const handleLeave = () => {
    playNavClick();
    leaveRoom();
    setPhase('online-setup');
  };

  return (
    <div className="page-full">
      <div className="landing-bg__orb landing-bg__orb--2" />
      <div className="landing-bg__orb landing-bg__orb--3" />

      <div className="setup-card anim-fade" style={{ maxWidth: 860, width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>
              Online Lobby
            </div>
            <h1 className="setup-title" style={{ margin: 0, fontSize: '2rem' }}>Waiting Room</h1>
            <p className="setup-subtitle" style={{ margin: '4px 0 0', opacity: 0.7 }}>
              {connectedPlayers.length} / 10 players connected
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>
              Room Code
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: 6, lineHeight: 1, background: 'linear-gradient(135deg, var(--gold), #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {roomCode}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
              Share this code with friends
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '10px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Players grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
          {players.map(p => {
            const av = AVATARS.find(a => String(a.id) === String(p.avatarId)) ?? AVATARS[0];
            const isMe = p.id === myPlayerId;
            return (
              <div key={p.id} style={{
                background: isMe ? 'rgba(255, 255, 255,0.1)' : 'rgba(255, 255, 255,0.04)',
                border: `2px solid ${p.isReady ? '#22c55e' : 'rgba(255, 255, 255,0.1)'}`,
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: p.connected ? 1 : 0.4,
                transition: 'border-color 0.3s, opacity 0.3s',
                position: 'relative',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: av.bgGradient, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={av.imagePath} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {p.name}
                    {p.id === hostId && <span title="Host" style={{ fontSize: '0.85rem' }}>👑</span>}
                    {isMe && <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.3)', color: '#a78bfa', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>you</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: p.isReady ? '#22c55e' : 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
                    {!p.connected ? '🔴 Disconnected' : p.isReady ? '✅ READY' : '⏳ Not Ready'}
                  </div>
                </div>
                {/* Host kick button */}
                {isHost && !isMe && p.connected && (
                  <button
                    onClick={() => kickPlayer(p.id)}
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: 8, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}
                    title="Kick player"
                  >
                    Kick
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ background: 'rgba(255, 255, 255,0.02)', border: '2px dashed rgba(255, 255, 255,0.08)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 72, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              Waiting for player...
            </div>
          ))}
        </div>

        {/* Host: game config status */}
        {isHost && (
          <div style={{ background: 'rgba(255, 255, 255,0.04)', border: '1px solid rgba(255, 255, 255,0.08)', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', fontWeight: 800 }}>Game Sequence</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>
                {selectedModes.length === 0
                  ? <span style={{ color: 'var(--text-muted)' }}>No games selected yet</span>
                  : <span style={{ color: '#a78bfa' }}>{selectedModes.length} game{selectedModes.length > 1 ? 's' : ''} selected</span>
                }
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
              onClick={() => { playNavClick(); setPhase('playing-sequence'); }}
            >
              {selectedModes.length > 0 ? '✏️ Edit Sequence' : '📋 Select Games'}
            </button>
          </div>
        )}

        {/* Actions footer */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255,0.08)', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={handleLeave}>
            ← Leave Room
          </button>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className="btn-skip"
              style={{ padding: '12px 24px' }}
              onClick={() => { playNavClick(); toggleReady(); }}
            >
              {players.find(p => p.id === myPlayerId)?.isReady ? '⏸ Unready' : '✅ Ready Up'}
            </button>

            {isHost && (
              <button
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem' }}
                disabled={!allReady || connectedPlayers.length < 2 || selectedModes.length === 0}
                onClick={handleStart}
                title={
                  !allReady ? 'Wait for all players to ready up' :
                  connectedPlayers.length < 2 ? 'Need at least 2 players' :
                  selectedModes.length === 0 ? 'Select at least one game' : ''
                }
              >
                🚀 Start Game
              </button>
            )}
          </div>
        </div>

        {/* Start requirements hint */}
        {isHost && (
          <div style={{ textAlign: 'right', marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {!allReady && '⚠ Waiting for all players to ready up · '}
            {connectedPlayers.length < 2 && '⚠ Need at least 2 players · '}
            {selectedModes.length === 0 && '⚠ No game sequence selected'}
          </div>
        )}
      </div>
      <SoundToggle />
    </div>
  );
}
