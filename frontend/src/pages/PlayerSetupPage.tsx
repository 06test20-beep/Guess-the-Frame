import React, { useState, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { AVATARS, MIN_PLAYERS, MAX_PLAYERS } from '../constants/game';
import type { Player } from '../types';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';

/* ── Step 1: select player count ─────────────────────────────────────────── */
function StepCount() {
  const { playerCount, setPlayerCount, setPhase } = useGameStore();
  const { playNavClick } = useSound();
  const counts = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS);

  return (
    <div className="page-full">
      <div className="setup-card anim-fade">
        <h1 className="setup-title">How Many Players?</h1>
        <p className="setup-subtitle">Select the number of players joining this game</p>

        <div className="setup-count-grid">
          {counts.map(n => (
            <button
              key={n}
              id={`player-count-btn-${n}`}
              className={`setup-count-btn ${playerCount === n ? 'setup-count-btn--active' : ''}`}
              onClick={() => {
                playNavClick();
                setPlayerCount(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, width:'100%' }}>
          <button
            id="proceed-to-setup-btn"
            className="btn-primary"
            style={{ width:'100%', maxWidth:320 }}
            onClick={() => { playNavClick(); setPhase('player-setup'); }}
          >
            🎮 Set Up Players →
          </button>
          <button className="btn-ghost" onClick={() => { playNavClick(); setPhase('landing'); }}>
            ← Back to Home
          </button>
        </div>
      </div>
      <SoundToggle />
    </div>
  );
}

/* ── Photo-or-avatar slot ────────────────────────────────────────────────── */
function PlayerPhotoSlot({
  index,
  avatarId,
  photoData,
  onPhotoChange,
  onAvatarChange,
}: {
  index: number;
  avatarId: number;
  photoData?: string;
  onPhotoChange: (data: string | undefined) => void;
  onAvatarChange: (id: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const av = AVATARS.find(a => a.id === avatarId);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Big avatar / photo preview */}
      <div
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: photoData ? 'transparent' : av?.bgGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          overflow: 'hidden', cursor: 'pointer',
          border: '2px solid rgba(155,89,182,0.2)',
          position: 'relative',
        }}
        title="Click to upload a photo"
        onClick={() => fileRef.current?.click()}
      >
        {photoData ? (
          <img
            src={photoData}
            alt="Player photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          av?.emoji
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        id={`player-photo-input-${index + 1}`}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      <div style={{ flex: 1 }}>
        {/* Avatar picker row */}
        <div className="avatar-picker">
          {AVATARS.map(a => (
            <button
              key={a.id}
              id={`avatar-player-${index + 1}-${a.id}`}
              className={`avatar-option ${avatarId === a.id && !photoData ? 'avatar-option--selected' : ''}`}
              style={{ background: a.bgGradient }}
              onClick={() => { onAvatarChange(a.id); onPhotoChange(undefined); }}
              title={a.label}
            >
              {a.emoji}
            </button>
          ))}
          {/* Clear photo button (shown only when a photo is set) */}
          {photoData && (
            <button
              className="avatar-option"
              style={{ background: 'rgba(239,68,68,0.12)', fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}
              onClick={() => onPhotoChange(undefined)}
              title="Remove photo"
            >
              ✕
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
          {photoData ? '📸 Photo set — click avatar to clear' : '🖼️ Click the circle above to upload a photo'}
        </div>
      </div>
    </div>
  );
}

/* ── Step 2: enter names + pick avatars / photos ─────────────────────────── */
function StepSetup() {
  const { playerCount, setPlayers, setPhase } = useGameStore();
  const { playNavClick, playStartGame } = useSound();

  const [names,   setNames]   = useState<string[]>(Array(playerCount).fill(''));
  const [avatars, setAvatars] = useState<number[]>(
    Array.from({ length: playerCount }, (_, i) => AVATARS[i % AVATARS.length].id)
  );
  const [photos,  setPhotos]  = useState<(string | undefined)[]>(Array(playerCount).fill(undefined));
  const [error,   setError]   = useState('');

  const updateName   = (i: number, v: string) =>
    setNames(prev  => { const n = [...prev]; n[i] = v; return n; });
  const updateAvatar = (i: number, id: number) =>
    setAvatars(prev => { const a = [...prev]; a[i] = id; return a; });
  const updatePhoto  = (i: number, data: string | undefined) =>
    setPhotos(prev  => { const p = [...prev]; p[i] = data; return p; });

  const handleStart = () => {
    const trimmed = names.map(n => n.trim());
    if (trimmed.some(n => n === '')) { setError('Please enter a name for every player.'); return; }
    const unique = new Set(trimmed.map(n => n.toLowerCase()));
    if (unique.size !== trimmed.length) { setError('Player names must be unique.'); return; }

    const players: Player[] = trimmed.map((name, i) => ({
      id:        `player-${i + 1}`,
      name:      name.toUpperCase(),
      avatarId:  avatars[i],
      photoData: photos[i],
      score:     0,
    }));
    setPlayers(players);
    playStartGame();
    setPhase('level-intro');
  };

  return (
    <div className="page-full" style={{ padding: '60px 20px' }}>
      <div className="setup-card anim-fade">
        <h1 className="setup-title">Who's Playing?</h1>
        <p className="setup-subtitle">Enter each player's name, pick an avatar, or upload a photo</p>

        <div className="setup-badge">
          <span>👥</span>
          <span>{playerCount} players ready</span>
        </div>

        <div
          className="player-input-grid"
          style={{ gridTemplateColumns: playerCount <= 3 ? '1fr' : playerCount <= 4 ? '1fr 1fr' : '1fr 1fr 1fr' }}
        >
          {Array.from({ length: playerCount }, (_, i) => (
            <div key={i} className="player-input-item">
              <span className="player-input-item__num">Player {i + 1}</span>

              {/* Name input */}
              <input
                id={`player-name-${i + 1}`}
                className="player-input-item__field"
                type="text"
                placeholder="Enter name…"
                value={names[i]}
                maxLength={12}
                onChange={e => updateName(i, e.target.value)}
              />

              {/* Photo / avatar slot */}
              <PlayerPhotoSlot
                index={i}
                avatarId={avatars[i]}
                photoData={photos[i]}
                onPhotoChange={data => updatePhoto(i, data)}
                onAvatarChange={id => updateAvatar(i, id)}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{ color:'var(--timer-red)', fontSize:'0.85rem', fontWeight:700, textAlign:'center' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, width:'100%' }}>
          <button
            id="start-game-btn"
            className="btn-primary"
            style={{ width:'100%', maxWidth:320, fontSize:'1rem' }}
            onClick={handleStart}
          >
            🎬 Start Game!
          </button>
          <button className="btn-ghost" onClick={() => { playNavClick(); setPhase('player-count'); }}>
            ← Back
          </button>
        </div>
      </div>
      <SoundToggle />
    </div>
  );
}

/* ── Router ───────────────────────────────────────────────────────────────── */
export default function PlayerSetupPage() {
  const phase = useGameStore(s => s.phase);
  return phase === 'player-count' ? <StepCount /> : <StepSetup />;
}
