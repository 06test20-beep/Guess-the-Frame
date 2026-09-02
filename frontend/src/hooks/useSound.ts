import { useCallback, useRef } from 'react';

/**
 * useSound — Web Audio API synthesised SFX (100% offline, no library).
 *
 * Sound state is read from localStorage key 'gtf_sound_on' so it persists
 * across the session. The SoundToggle button sets this key.
 *
 * All sounds are procedurally generated via OscillatorNode — no audio files
 * to download or host.
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const isEnabled = useCallback((): boolean => {
    return localStorage.getItem('gtf_sound_on') !== 'false';
  }, []);

  /** Short high-pitched tick for countdown */
  const playTick = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.08);
  }, [getCtx, isEnabled]);

  /** Urgent descending buzz for the last 5 seconds */
  const playUrgentTick = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t); osc.stop(t + 0.12);
  }, [getCtx, isEnabled]);

  /** Timer hit zero — dramatic descending drone */
  const playTimerEnd = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    [300, 200, 100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.18);
      gain.gain.setValueAtTime(0.14, t + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.25);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 0.25);
    });
  }, [getCtx, isEnabled]);

  /** Bright rising arpeggio for correct answer / points awarded */
  const playCorrect = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.13, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }, [getCtx, isEnabled]);

  /** Descending buzz for wrong answer / minus points */
  const playWrong = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t); osc.stop(t + 0.4);
  }, [getCtx, isEnabled]);

  /** Soft whoosh for answer reveal */
  const playReveal = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.5);
  }, [getCtx, isEnabled]);

  /** Subtle modern UI blip for navigation buttons */
  const playNavClick = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.05);
  }, [getCtx, isEnabled]);

  /** Cinematic, deep sweeping chord for starting the game */
  const playStartGame = useCallback(() => {
    if (!isEnabled()) return;
    const ctx = getCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    [150, 225, 300].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.5);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t); osc.stop(t + 0.8);
    });
  }, [getCtx, isEnabled]);

  return { playTick, playUrgentTick, playTimerEnd, playCorrect, playWrong, playReveal, playNavClick, playStartGame };
}
