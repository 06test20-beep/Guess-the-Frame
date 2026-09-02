import type { Avatar, LevelMeta } from '../types';

// ─── Scoring ─────────────────────────────────────────────────────────────────
export const CORRECT_POINTS   = 10;
export const WRONG_POINTS     = -5;
export const JUDGE_BONUS      = 20;
export const TIMER_SECONDS    = 30;
export const ROUNDS_PER_LEVEL = 10;
export const TOTAL_LEVELS     = 4;
export const MIN_PLAYERS      = 2;
export const MAX_PLAYERS      = 8;

// ─── Level meta ──────────────────────────────────────────────────────────────
export const LEVELS: Record<number, LevelMeta> = {
  1: {
    id: 1,
    title: 'Guess the Frame',
    subtitle: 'Bollywood Edition',
    icon: '🎬',
    iconBg: 'linear-gradient(135deg, #FF6EB4, #9B59B6)',
    rounds: 10,
    countdownLabel: 'GET READY!',
  },
  2: {
    id: 2,
    title: 'Guess the Frame',
    subtitle: 'Hollywood Edition',
    icon: '🎬',
    iconBg: 'linear-gradient(135deg, #FF6EB4, #9B59B6)',
    rounds: 10,
    countdownLabel: 'GET READY!',
  },
  3: {
    id: 3,
    title: 'Guess the Eye',
    subtitle: 'Who is it?',
    icon: '👁️',
    iconBg: 'linear-gradient(135deg, #b06fe0, #7b3cb5)',
    rounds: 10,
    countdownLabel: 'EYES ON SCREEN!',
  },
  4: {
    id: 4,
    title: 'Guess the Dialogue',
    subtitle: 'Which movie?',
    icon: '💬',
    iconBg: 'linear-gradient(135deg, #d06eff, #9B59B6)',
    rounds: 10,
    countdownLabel: 'LISTEN UP!',
  },
};

// ─── Avatars ─────────────────────────────────────────────────────────────────
export const AVATARS: Avatar[] = [
  { id: 1,  imagePath: '/assets/avatars/popcorn.jpg',      bgGradient: 'linear-gradient(135deg,#c084fc,#818cf8)', label: 'Popcorn'    },
  { id: 2,  imagePath: '/assets/avatars/clapperboard.jpg', bgGradient: 'linear-gradient(135deg,#f472b6,#ec4899)', label: 'Clapper'    },
  { id: 3,  imagePath: '/assets/avatars/ticket.jpg',       bgGradient: 'linear-gradient(135deg,#fb923c,#f97316)', label: 'Ticket'     },
  { id: 4,  imagePath: '/assets/avatars/trophy.jpg',       bgGradient: 'linear-gradient(135deg,#34d399,#10b981)', label: 'Trophy'     },
  { id: 5,  imagePath: '/assets/avatars/megaphone.jpg',    bgGradient: 'linear-gradient(135deg,#60a5fa,#3b82f6)', label: 'Megaphone'  },
  { id: 6,  imagePath: '/assets/avatars/glasses.jpg',      bgGradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)', label: '3D Glasses' },
  { id: 7,  imagePath: '/assets/avatars/filmreel.jpg',     bgGradient: 'linear-gradient(135deg,#f43f5e,#e11d48)', label: 'Film Reel'  },
  { id: 8,  imagePath: '/assets/avatars/star.jpg',         bgGradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)', label: 'Star'       },
];
