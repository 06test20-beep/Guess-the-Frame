import type { Avatar, LevelMeta } from '../types';

// ─── Scoring ─────────────────────────────────────────────────────────────────
export const CORRECT_POINTS   = 10;
export const WRONG_POINTS     = -5;
export const JUDGE_BONUS      = 20;
export const TIMER_SECONDS    = 30;
export const ROUNDS_PER_LEVEL = 10;
export const TOTAL_LEVELS     = 9;
export const MIN_PLAYERS      = 2;
export const MAX_PLAYERS      = 8;

// ─── Level meta ──────────────────────────────────────────────────────────────
export const LEVELS: Record<number, LevelMeta> = {
  1: {
    id: 1,
    title: 'Hollywood',
    subtitle: 'Rounds 1-10',
    icon: '🎬',
    iconBg: 'linear-gradient(135deg, #FF6EB4, #9B59B6)',
    rounds: 10,
    countdownLabel: 'GET READY!',
  },
  2: {
    id: 2,
    title: 'Indian Movies',
    subtitle: 'Rounds 11-20',
    icon: '🍿',
    iconBg: 'linear-gradient(135deg, #FF8C00, #FF0080)',
    rounds: 10,
    countdownLabel: 'GET READY!',
  },
  3: {
    id: 3,
    title: 'Distorted Frame',
    subtitle: 'Rounds 21-30',
    icon: '🌀',
    iconBg: 'linear-gradient(135deg, #00C9FF, #92FE9D)',
    rounds: 10,
    countdownLabel: 'FOCUS!',
  },
  4: {
    id: 4,
    title: 'Guess The Eyes',
    subtitle: 'Rounds 31-40',
    icon: '👁️',
    iconBg: 'linear-gradient(135deg, #b06fe0, #7b3cb5)',
    rounds: 10,
    countdownLabel: 'EYES ON SCREEN!',
  },
  5: {
    id: 5,
    title: 'Guess The Dialogues',
    subtitle: 'Rounds 41-50',
    icon: '💬',
    iconBg: 'linear-gradient(135deg, #d06eff, #9B59B6)',
    rounds: 10,
    countdownLabel: 'LISTEN UP!',
  },
  6: {
    id: 6,
    title: 'Guess Release Year',
    subtitle: 'Rounds 51-60',
    icon: '📅',
    iconBg: 'linear-gradient(135deg, #11998e, #38ef7d)',
    rounds: 10,
    countdownLabel: 'THINK BACK!',
  },
  7: {
    id: 7,
    title: 'Bollywood In English',
    subtitle: '10 Text Rounds',
    icon: '🔤',
    iconBg: 'linear-gradient(135deg, #FF416C, #FF4B2B)',
    rounds: 10,
    countdownLabel: 'READ CAREFULLY!',
  },
  8: {
    id: 8,
    title: 'Hollywood In Hindi',
    subtitle: '10 Text Rounds',
    icon: '🗣️',
    iconBg: 'linear-gradient(135deg, #f12711, #f5af19)',
    rounds: 10,
    countdownLabel: 'READ CAREFULLY!',
  },
  9: {
    id: 9,
    title: 'This and That',
    subtitle: '10 Poster Duels',
    icon: '⚔️',
    iconBg: 'linear-gradient(135deg, #8E2DE2, #4A00E0)',
    rounds: 10,
    countdownLabel: 'CHOOSE WISELY!',
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
