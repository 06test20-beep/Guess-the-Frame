import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'gtf_sound_on';

export default function SoundToggle({ inline = false }: { inline?: boolean }) {
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
      className={inline ? "btn-ghost" : "sound-toggle"}
      style={inline ? { color: 'var(--text-secondary)', padding: '6px' } : undefined}
      onClick={toggle}
      title={on ? 'Mute sound effects' : 'Unmute sound effects'}
      aria-label={on ? 'Mute' : 'Unmute'}
      id={inline ? undefined : "sound-toggle-btn"}
    >
      {on ? <Volume2 size={inline ? 18 : 24} color={inline ? "var(--text-secondary)" : "var(--primary)"} /> : <VolumeX size={inline ? 18 : 24} color="#ef4444" />}
    </button>
  );
}
