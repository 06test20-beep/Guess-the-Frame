import React, { useEffect, useRef } from 'react';
import { TIMER_SECONDS } from '../constants/game';
import useGameStore from '../store/gameStore';

const SIZE   = 110;
const RADIUS = 44;
const CIRC   = 2 * Math.PI * RADIUS;

export default function TimerRing() {
  const { timeRemaining, timerRunning, tickTimer } = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(tickTimer, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const pct      = timeRemaining / TIMER_SECONDS;
  const offset   = CIRC * (1 - pct);
  const color    = timeRemaining > 10 ? 'var(--timer-green)'
                 : timeRemaining > 5  ? 'var(--timer-yellow)'
                 : 'var(--timer-red)';
  const numColor = timeRemaining > 0 ? color : 'var(--text-muted)';

  // Rotate the arc circles so the arc starts at 12 o'clock (top)
  const rot = `rotate(-90, ${SIZE / 2}, ${SIZE / 2})`;

  return (
    <div className="timer-ring-wrap">
      {/* No transform on the SVG itself — only on the circle elements */}
      <svg width={SIZE} height={SIZE}>
        {/* Track circle */}
        <circle
          cx={SIZE/2} cy={SIZE/2} r={RADIUS}
          fill="none"
          stroke="rgba(155,89,182,0.1)"
          strokeWidth="8"
          transform={rot}
        />
        {/* Progress arc */}
        <circle
          className={(timeRemaining <= 5 && timeRemaining > 0) ? 'timer-heartbeat' : ''}
          cx={SIZE/2} cy={SIZE/2} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={rot}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
        {/* Number — no rotation applied, always upright */}
        <text
          x={SIZE/2} y={SIZE/2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={numColor}
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: '22px',
            transition: 'fill 0.5s ease',
          }}
        >
          {timeRemaining}
        </text>
      </svg>
      <span className="timer-ring-label">Time Remaining</span>
    </div>
  );
}
