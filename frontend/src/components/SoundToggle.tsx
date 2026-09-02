import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'gtf_sound_on';

export default function SoundToggle() {
  const [on, setOn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <button
      className="sound-toggle"
      onClick={toggle}
      title={on ? 'Mute sound effects' : 'Unmute sound effects'}
      aria-label={on ? 'Mute' : 'Unmute'}
      id="sound-toggle-btn"
    >
      {on ? <Volume2 size={24} color="var(--primary)" /> : <VolumeX size={24} color="#ef4444" />}
    </button>
  );
}
