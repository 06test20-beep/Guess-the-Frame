import React, { useState, useEffect, useRef } from 'react';

interface Props {
  value: number;
  className?: string;
}

/**
 * AnimatedScore — displays a score that smoothly ticks up/down when value changes.
 * Uses requestAnimationFrame for a buttery smooth counter animation.
 */
export default function AnimatedScore({ value, className = '' }: Props) {
  const [displayed, setDisplayed] = useState(value);
  const animRef   = useRef<number | null>(null);
  const fromRef   = useRef(value);
  const startRef  = useRef<number | null>(null);
  const DURATION  = 600; // ms

  useEffect(() => {
    // Cancel any in-flight animation
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);

    const from = fromRef.current;
    const to   = value;
    if (from === to) return;

    startRef.current = null;

    const tick = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(to);
        fromRef.current = to;
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  return <span className={className}>{displayed}</span>;
}
