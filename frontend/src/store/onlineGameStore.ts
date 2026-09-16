import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { LevelId, ModeId, GameMode } from '../types';
import type {
  OnlinePlayer,
  RoomState,
  ClientQuestion,
  RoundPhase,
  FinalScore,
  ActivityFeedItem,
} from '../types/online';
import { getQuestionsForMode } from '../utils/questionStorage';
import { getImage } from '../utils/indexedDB';
import { isIdbKey } from '../utils/migration';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

// ── Guess result from server ───────────────────────────────────────────────
export interface GuessResult {
  type: 'correct' | 'wrong' | 'near_miss' | 'rate_limited' | 'already_correct';
  points?: number;
  breakdown?: { base: number; speed: number; streak: number };
  message?: string;
}

// ── Image cache (avoids re-fetching within a session) ─────────────────────
const imageCache = new Map<string, string>(); // imageKey → data URL

function resolveImageKey(imageKey: string | undefined, requestImage: (key: string) => void): string | null {
  if (!imageKey) return null;
  // Public static assets — resolve directly
  if (imageKey.startsWith('path:')) {
    return imageKey.slice('path:'.length);
  }
  // Session asset — check cache first
  if (imageCache.has(imageKey)) {
    return imageCache.get(imageKey)!;
  }
  // Request from server (async — will update when received)
  requestImage(imageKey);
  return null;
}

// ── Store shape ────────────────────────────────────────────────────────────
interface OnlineGameState {
  socket: Socket | null;
  myPlayerId: string | null;
  roomCode: string | null;
  hostId: string | null;
  players: OnlinePlayer[];
  roomState: 'lobby' | 'playing' | 'results';
  error: string | null;
  serverError: string | null; // Persistent server errors (room not found, etc.)

  // Round state (populated during gameplay)
  roundPhase: RoundPhase | null;
  roundEndTimeMs: number | null;
  firstCorrectTimeMs: number | null;
  currentClientQuestion: ClientQuestion | null;
  revealedAnswer: string | null;
  currentModeId: ModeId | null;
  currentLevelId: LevelId | null; // V1 compat
  currentModeIndex: number | null;
  currentRoundNumber: number | null;
  totalRoundsInMode: number | null;

  // Feedback
  myLastGuessResult: GuessResult | null;
  activityFeed: ActivityFeedItem[];

  // Final results
  finalScores: FinalScore[];
  awards: Record<string, string>;

  // Image resolution
  resolvedImageUrl: string | null;
  resolvedFullImageUrl: string | null; // eye questions only — full-face image for reveal

  // ── Actions ────────────────────────────────────────────────────────────
  connect: (playerId: string) => void;
  createRoom: (player: { name: string; avatarId: string }) => Promise<void>;
  joinRoom: (roomCode: string, player: { name: string; avatarId: string }) => Promise<void>;
  toggleReady: () => void;
  startGame: (selectedModes: ModeId[]) => void;
  kickPlayer: (targetId: string) => void;
  submitGuess: (guess: string) => void;
  revealEarly: () => void;
  requestImage: (imageKey: string) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

export const useOnlineGameStore = create<OnlineGameState>((set, get) => ({
  socket: null,
  myPlayerId: null,
  roomCode: null,
  hostId: null,
  players: [],
  roomState: 'lobby',
  error: null,
  serverError: null,

  roundPhase: null,
  roundEndTimeMs: null,
  firstCorrectTimeMs: null,
  currentClientQuestion: null,
  revealedAnswer: null,
  currentModeId: null,
  currentLevelId: null,
  currentModeIndex: null,
  currentRoundNumber: null,
  totalRoundsInMode: null,

  myLastGuessResult: null,
  activityFeed: [],

  finalScores: [],
  awards: {},
  resolvedImageUrl: null,
  resolvedFullImageUrl: null,

  // ── connect ────────────────────────────────────────────────────────────
  connect: (playerId: string) => {
    // Guard: socket already exists (connecting or connected) — don't create another
    if (get().socket) return;

    const newSocket = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Store socket immediately so callers can attach .once('connect') listeners
    set({ socket: newSocket });

    newSocket.on('connect', () => {
      newSocket.emit('join_server', playerId);
      set({ myPlayerId: playerId, serverError: null });
    });

    // ── Room state sync ──────────────────────────────────────────────────
    newSocket.on('room_state_update', (data: RoomState) => {
      // Resolve image for current question
      let resolvedImageUrl = get().resolvedImageUrl;
      const q = data.currentClientQuestion;
      if (q?.imageKey) {
        const resolved = resolveImageKey(q.imageKey, (key) => {
          newSocket.emit('game_action', { type: 'REQUEST_IMAGE', payload: key }, () => {});
        });
        if (resolved) resolvedImageUrl = resolved;
      }

      set({
        roomCode: data.code,
        hostId: data.hostId,
        players: data.players,
        roomState: data.phase,   // RoomState contract uses 'phase', not 'state'
        roundPhase: data.roundPhase ?? null,
        roundEndTimeMs: data.roundEndTimeMs ?? null,
        firstCorrectTimeMs: data.firstCorrectTimeMs ?? null,
        currentClientQuestion: data.currentClientQuestion ?? null,
        revealedAnswer: data.revealedAnswer ?? null,
        currentModeId: data.currentModeId ?? null,
        currentLevelId: data.currentLevelId ?? null,
        currentModeIndex: data.currentModeIndex ?? null,
        currentRoundNumber: data.currentRoundNumber ?? null,
        totalRoundsInMode: data.totalRoundsInMode ?? null,
        resolvedImageUrl,
        error: null,
      });
    });

    // ── Round events ─────────────────────────────────────────────────────
    newSocket.on('round_start', (data: any) => {
      console.log('TRACE [Frontend ROUND_START Received]');
      console.log(`- received imageKey: ${data.clientQuestion?.imageKey}`);
      // New round — clear per-round state
      set({
        myLastGuessResult: null,
        revealedAnswer: null,
        currentClientQuestion: data.clientQuestion ?? null,
        roundPhase: 'active',
        roundEndTimeMs: data.roundEndTimeMs ?? null,
        firstCorrectTimeMs: null,
        currentModeId: data.modeId ?? null,
        currentLevelId: data.levelId ?? null,
        currentModeIndex: data.modeIndex ?? null,
        currentRoundNumber: data.roundIndex + 1,
        totalRoundsInMode: data.totalRounds ?? null,
        activityFeed: [],
        resolvedImageUrl: null,
        resolvedFullImageUrl: null,
      });

      // Immediately resolve or request crop image
      const q = data.clientQuestion as ClientQuestion | undefined;
      if (q?.imageKey) {
        if (q.imageKey.startsWith('path:')) {
          console.log(`TRACE [Frontend] Resolving path: key -> ${q.imageKey.slice('path:'.length)}`);
          set({ resolvedImageUrl: q.imageKey.slice('path:'.length) });
        } else if (imageCache.has(q.imageKey)) {
          console.log(`TRACE [Frontend] Resolving image cache key -> (found)`);
          set({ resolvedImageUrl: imageCache.get(q.imageKey)! });
        } else {
          console.log(`TRACE [Frontend] Resolving img_ key -> emitting REQUEST_IMAGE`);
          newSocket.emit('game_action', { type: 'REQUEST_IMAGE', payload: q.imageKey }, () => {});
        }
      } else {
        console.log(`TRACE [Frontend] No imageKey present in clientQuestion`);
      }

      // Pre-fetch full image in background so reveal is instant
      if (q?.type === 'eye' && q.fullImageKey) {
        if (q.fullImageKey.startsWith('path:')) {
          // Path-based full image — pre-cache the URL
          imageCache.set(q.fullImageKey, q.fullImageKey.slice('path:'.length));
        } else if (!imageCache.has(q.fullImageKey)) {
          newSocket.emit('game_action', { type: 'REQUEST_IMAGE', payload: q.fullImageKey }, () => {});
        }
      }
    });

    newSocket.on('round_end', (data: any) => {
      const currentQ = get().currentClientQuestion;
      let resolvedFullImageUrl: string | null = null;

      // Resolve full image for eye reveal
      if (currentQ?.type === 'eye' && currentQ.fullImageKey) {
        const fk = currentQ.fullImageKey;
        if (fk.startsWith('path:')) {
          resolvedFullImageUrl = fk.slice('path:'.length);
        } else if (imageCache.has(fk)) {
          resolvedFullImageUrl = imageCache.get(fk)!;
        } else {
          // Not in cache yet — request it now and it will arrive via image_data
          newSocket.emit('game_action', { type: 'REQUEST_IMAGE', payload: fk }, () => {});
        }
      }

      set({
        roundPhase: 'reveal',
        revealedAnswer: data.revealedAnswer,
        players: data.scores ?? get().players,
        resolvedFullImageUrl,
      });
    });

    newSocket.on('level_end', (data: any) => {
      set({ players: data.scores ?? get().players });
    });

    newSocket.on('game_over', (data: any) => {
      set({
        finalScores: data.finalScores ?? [],
        awards: data.awards ?? {},
        roomState: 'results',
      });
    });

    // ── Guess result (only sent to this player) ──────────────────────────
    newSocket.on('guess_result', (result: GuessResult) => {
      set({ myLastGuessResult: result });
    });

    // ── Activity feed ─────────────────────────────────────────────────────
    newSocket.on('activity_feed', (item: ActivityFeedItem) => {
      set(s => ({
        activityFeed: [item, ...s.activityFeed].slice(0, 20), // keep last 20
      }));
    });

    // ── Image data (only sent to requesting player) ────────────────────────
    newSocket.on('image_data', (data: { key: string; mimeType: string; data: string }) => {
      imageCache.set(data.key, data.data);
      const currentQ = get().currentClientQuestion;
      // Crop image for active question
      if (currentQ?.imageKey === data.key) {
        set({ resolvedImageUrl: data.data });
      }
      // Full image for reveal (if we're already in reveal phase or it just arrived)
      if (currentQ?.fullImageKey === data.key) {
        set({ resolvedFullImageUrl: data.data });
      }
    });

    // ── Player kicked ─────────────────────────────────────────────────────
    newSocket.on('player_kicked', (targetId: string) => {
      if (targetId === get().myPlayerId) {
        get().leaveRoom();
        set({ error: 'You have been removed from the room by the host.' });
      }
    });

    // ── Graceful room-not-found (server restart) ──────────────────────────
    newSocket.on('room_not_found', (data: { message: string }) => {
      set({
        serverError: data.message,
        roomCode: null,
        roomState: 'lobby',
      });
    });

    newSocket.on('server_error', (data: { message: string }) => {
      set({ error: data.message });
    });

    set({ socket: newSocket });
  },

  // ── createRoom ────────────────────────────────────────────────────────
  createRoom: (player) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('Not connected');

      socket.emit('create_room', { player }, (res: any) => {
        if (res?.success) {
          set({ roomCode: res.roomCode, error: null });
          resolve();
        } else {
          set({ error: res?.error ?? 'Failed to create room' });
          reject(res?.error);
        }
      });
    });
  },

  // ── joinRoom ──────────────────────────────────────────────────────────
  joinRoom: (roomCode, player) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('Not connected');

      socket.emit('join_room', { roomCode, player }, (res: any) => {
        if (res?.success) {
          set({ roomCode: res.roomCode, error: null });
          resolve();
        } else {
          set({ error: res?.error ?? 'Failed to join room' });
          reject(res?.error);
        }
      });
    });
  },

  // ── toggleReady ───────────────────────────────────────────────────────
  toggleReady: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('game_action', { type: 'TOGGLE_READY' }, () => {});
    }
  },

  // ── startGame ─────────────────────────────────────────────────────────
  startGame: async (selectedModes: ModeId[]) => {
    const { socket } = get();
    if (!socket) return;

    // Build the payload: for each selected mode, send the host's custom questions
    // (which include custom imageData from the Admin Panel) with a fallback to defaults.
    // getQuestionsForMode handles both fallback and loading custom V2 data.
    const modesData: Record<string, any[]> = {};
    // Find all custom images referenced by the selected modes
    const assets: Record<string, { mimeType: string; data: string }> = {};
    const idbPromises: Promise<void>[] = [];
    const resolvedImages = new Map<string, string>();

    console.log('TRACE [Frontend emitting START_GAME]');
    for (const modeId of selectedModes) {
      // Deep copy to avoid mutating the store or local storage state
      modesData[modeId] = JSON.parse(JSON.stringify(getQuestionsForMode(modeId)));
      const q = modesData[modeId][0];
      
      console.log(`- Mode: ${modeId}, Q1 ID: ${q?.id}, type: ${q?.type}`);
      console.log(`- imageData present: ${!!q?.imageData}`);
      console.log(`- imagePath present: ${!!q?.imagePath}, val: ${q?.imagePath}`);
      console.log(`- is idb key? ${isIdbKey(q?.imageData ?? '')}`);

      for (const q of modesData[modeId]) {
        if (q.imageData && isIdbKey(q.imageData)) {
          const key = q.imageData;
          if (!resolvedImages.has(key)) {
            resolvedImages.set(key, ''); // placeholder to prevent duplicate requests
            idbPromises.push(getImage(key).then(data => { if (data) resolvedImages.set(key, data); }));
          }
        }
        if (q.fullImageData && isIdbKey(q.fullImageData)) {
          const key = q.fullImageData;
          if (!resolvedImages.has(key)) {
            resolvedImages.set(key, '');
            idbPromises.push(getImage(key).then(data => { if (data) resolvedImages.set(key, data); }));
          }
        }
      }
    }

    await Promise.all(idbPromises);

    const MAX_SINGLE_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
    const MAX_TOTAL_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
    let totalBytes = 0;

    // Replace idb keys with base64 data and enforce limits
    for (const modeId of selectedModes) {
      for (const q of modesData[modeId]) {
        if (q.imageData && isIdbKey(q.imageData)) {
          const base64 = resolvedImages.get(q.imageData) || undefined;
          if (base64) {
            const bytes = Math.ceil((base64.length * 3) / 4);
            if (bytes > MAX_SINGLE_IMAGE_BYTES) {
              set({ error: `Image for question ${q.questionNumber} is too large (${(bytes/1024/1024).toFixed(1)}MB). Max 2MB.` });
              return;
            }
            totalBytes += bytes;
          }
          q.imageData = base64;
        }
        if (q.fullImageData && isIdbKey(q.fullImageData)) {
          const base64 = resolvedImages.get(q.fullImageData) || undefined;
          if (base64) {
             const bytes = Math.ceil((base64.length * 3) / 4);
             if (bytes > MAX_SINGLE_IMAGE_BYTES) {
               set({ error: `Full image for question ${q.questionNumber} is too large (${(bytes/1024/1024).toFixed(1)}MB). Max 2MB.` });
               return;
             }
             totalBytes += bytes;
          }
          q.fullImageData = base64;
        }
      }
    }

    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      set({ error: `Total session size (${(totalBytes/1024/1024).toFixed(1)}MB) exceeds the 10MB limit. Please select fewer modes or smaller images.` });
      return;
    }

    socket.emit(
      'game_action',
      {
        type: 'START_GAME',
        payload: { selectedModes, modesData },
      },
      (res: any) => {
        if (res?.error) {
          set({ error: res.error });
        }
      }
    );
  },


  // ── kickPlayer ────────────────────────────────────────────────────────
  kickPlayer: (targetId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('game_action', { type: 'KICK_PLAYER', payload: targetId }, () => {});
    }
  },

  // ── submitGuess ───────────────────────────────────────────────────────
  submitGuess: (guess: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('game_action', { type: 'SUBMIT_GUESS', payload: guess }, (res: any) => {
      if (res?.error) console.error('Submit guess error:', res.error);
    });
  },

  revealEarly: () => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('game_action', { type: 'REVEAL_EARLY' }, (res: any) => {
      if (res?.error) console.error('Reveal early error:', res.error);
    });
  },

  // ── requestImage ──────────────────────────────────────────────────────
  requestImage: (imageKey) => {
    const { socket } = get();
    if (socket) {
      socket.emit('game_action', { type: 'REQUEST_IMAGE', payload: imageKey }, () => {});
    }
  },

  // ── leaveRoom ─────────────────────────────────────────────────────────
  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    imageCache.clear();
    set({
      socket: null,
      myPlayerId: null,
      roomCode: null,
      hostId: null,
      players: [],
      roomState: 'lobby',
      roundPhase: null,
      roundEndTimeMs: null,
      firstCorrectTimeMs: null,
      currentClientQuestion: null,
      revealedAnswer: null,
      currentModeId: null,
      currentLevelId: null,
      currentModeIndex: null,
      currentRoundNumber: null,
      totalRoundsInMode: null,
      myLastGuessResult: null,
      activityFeed: [],
      finalScores: [],
      awards: {},
      resolvedImageUrl: null,
      resolvedFullImageUrl: null,
      error: null,
      serverError: null,
    });
  },

  clearError: () => set({ error: null }),
}));
