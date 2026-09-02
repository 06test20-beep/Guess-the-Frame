import React, { useState, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { AVATARS, MIN_PLAYERS, MAX_PLAYERS } from '../constants/game';
import type { Player } from '../types';
import SoundToggle from '../components/SoundToggle';
import { useSound } from '../hooks/useSound';
import { Dices } from 'lucide-react';

const MOVIE_CHARACTER_NAMES = [
  "Couch Potato", "Spoiler Alert", "Plot Twist", "Stunt Double", 
  "The Director", "Extra #4", "CGI Monster", "Oscar Snub", 
  "Binge Watcher", "Popcorn Addict", "Bollywood Hero", "The Villain", 
  "Rom-Com Lead", "Red Shirt", "Method Actor", "Cinephile",
  "Box Office Flop", "Sequel Bait", "Director's Cut", "Stan", 
  "Fanboy", "Fangirl", "Main Character", "Comic Relief",
  "The Chosen One", "Secret Agent", "Final Girl", "Jump Scare",
  "Meme Lord", "Simp-man", "The Intern", "Overpaid Star"
];

function getRandomMovieNames(count: number): string[] {
  const shuffled = [...MOVIE_CHARACTER_NAMES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

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
          <img src={av?.imagePath} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
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
              <img src={a.imagePath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
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

  const [names,   setNames]   = useState<string[]>(() => getRandomMovieNames(playerCount));
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

              {/* Name input with auto-generate button */}
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  id={`player-name-${i + 1}`}
                  className="player-input-item__field"
                  type="text"
                  placeholder="Enter name…"
                  value={names[i]}
                  maxLength={12}
                  onChange={e => updateName(i, e.target.value)}
                  style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    playNavClick();
                    let newName = getRandomMovieNames(1)[0];
                    // ensure we don't pick a name already used by another player
                    let attempts = 0;
                    while (names.includes(newName) && attempts < 10) {
                      newName = getRandomMovieNames(1)[0];
                      attempts++;
                    }
                    updateName(i, newName);
                  }}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)',
                    opacity: 0.7, padding: 0, display: 'flex', alignItems: 'center'
                  }}
                  title="Generate random movie name"
                >
                  <Dices size={20} />
                </button>
              </div>

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
