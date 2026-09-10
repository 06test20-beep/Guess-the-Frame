import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { AVATARS } from '../constants/game';
import { useSound } from '../hooks/useSound';
import SoundToggle from '../components/SoundToggle';

export default function OnlineSetupPage() {
  const setPhase = useGameStore(s => s.setPhase);
  const { connect, createRoom, joinRoom, error } = useOnlineGameStore();
  const { playNavClick, playStartGame } = useSound();

  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Wait for the socket to be fully connected before emitting room events. */
  const waitForConnect = (sock: ReturnType<typeof import('socket.io-client').io>): Promise<void> =>
    new Promise((resolve, reject) => {
      if (sock.connected) { resolve(); return; }
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      sock.once('connect', () => { clearTimeout(timeout); resolve(); });
      sock.once('connect_error', (err) => { clearTimeout(timeout); reject(err); });
    });

  const handleCreate = async () => {
    if (!name.trim()) return;
    playNavClick();
    setLoading(true);

    const playerId = 'player_' + Math.random().toString(36).substr(2, 9);
    connect(playerId);

    try {
      // Wait until the socket handshake is complete before emitting
      const sock = useOnlineGameStore.getState().socket!;
      await waitForConnect(sock as any);
      await createRoom({ name: name.trim(), avatarId: String(avatarId) });
      setPhase('online-lobby');
    } catch (e: any) {
      console.error('[Setup] create room failed:', e);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCodeInput.trim()) return;
    playNavClick();
    setLoading(true);

    const playerId = 'player_' + Math.random().toString(36).substr(2, 9);
    connect(playerId);

    try {
      const sock = useOnlineGameStore.getState().socket!;
      await waitForConnect(sock as any);
      await joinRoom(roomCodeInput.trim(), { name: name.trim(), avatarId: String(avatarId) });
      setPhase('online-lobby');
    } catch (e: any) {
      console.error('[Setup] join room failed:', e);
    }
    setLoading(false);
  };

  return (
    <div className="page-full">
      <div className="landing-bg__orb landing-bg__orb--1" />
      <div className="landing-bg__orb landing-bg__orb--3" />

      <div className="setup-card anim-slide">
        <h1 className="setup-title">Online Multiplayer</h1>
        <p className="setup-subtitle">Play with friends anywhere.</p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 16px', borderRadius: 12, marginBottom: 16, border: '1px solid #fca5a5', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Identity */}
          <div className="player-input-item">
            <span className="player-input-item__num">Your Nickname</span>
            <input
              className="player-input-item__field"
              type="text"
              placeholder="Enter name..."
              value={name}
              onChange={e => setName(e.target.value.slice(0, 16))}
              disabled={loading}
            />
          </div>

          <div className="player-input-item">
            <span className="player-input-item__num">Choose Avatar</span>
            <div className="avatar-picker">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  className={`avatar-option ${avatarId === av.id ? 'avatar-option--selected' : ''}`}
                  onClick={() => { playNavClick(); setAvatarId(av.id); }}
                  disabled={loading}
                  title={av.label}
                  style={{ background: av.bgGradient }}
                >
                  <img src={av.imagePath} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-soft)', margin: '10px 0' }} />

          {/* Action toggle */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn-skip ${!isJoining ? 'btn-outline' : ''}`}
              style={{ flex: 1, borderColor: !isJoining ? 'var(--purple)' : 'var(--border-soft)', color: !isJoining ? 'var(--purple)' : 'var(--text-secondary)' }}
              onClick={() => { playNavClick(); setIsJoining(false); }}
              disabled={loading}
            >
              Host Game
            </button>
            <button
              className={`btn-skip ${isJoining ? 'btn-outline' : ''}`}
              style={{ flex: 1, borderColor: isJoining ? 'var(--purple)' : 'var(--border-soft)', color: isJoining ? 'var(--purple)' : 'var(--text-secondary)' }}
              onClick={() => { playNavClick(); setIsJoining(true); }}
              disabled={loading}
            >
              Join Game
            </button>
          </div>

          {/* Action section */}
          {isJoining ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <input
                className="player-input-item__field"
                style={{ flex: 1, textTransform: 'uppercase' }}
                type="text"
                placeholder="ROOM CODE"
                value={roomCodeInput}
                onChange={e => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                disabled={loading}
                maxLength={4}
              />
              <button
                className="btn-primary"
                onClick={handleJoin}
                disabled={!name.trim() || roomCodeInput.length !== 4 || loading}
                title={!name.trim() ? "Please enter your nickname above" : roomCodeInput.length !== 4 ? "Enter a 4-letter room code" : ""}
              >
                {loading ? 'Joining...' : !name.trim() ? 'Enter Name ↑' : roomCodeInput.length !== 4 ? 'Enter Code' : 'Join Room'}
              </button>
            </div>
          ) : (
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 10 }}
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              title={!name.trim() ? "Please enter your nickname above" : ""}
            >
              {loading ? 'Creating...' : !name.trim() ? 'Enter Nickname First ↑' : 'Create Room'}
            </button>
          )}

        </div>

        <button
          className="btn-ghost"
          style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
          onClick={() => { playNavClick(); setPhase('landing'); }}
          disabled={loading}
        >
          ← Back to Main Menu
        </button>
      </div>
      <SoundToggle />
    </div>
  );
}
