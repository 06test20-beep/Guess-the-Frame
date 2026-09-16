// ─────────────────────────────────────────────────────────────────────────────
//  RoundEngine — authoritative game state machine for a single room.
//  Manages the full lifecycle: lobby → intro → active → first_correct →
//  5s window → reveal → next round → next level → final results.
//
//  All timers, scores, streaks, and round transitions are server-controlled.
//  Clients only send actions; results come from here.
// ─────────────────────────────────────────────────────────────────────────────

import { Server } from 'socket.io';
import {
  OnlinePlayer,
  RoundPhase,
  ServerQuestion,
  ClientQuestion,
  ONLINE_BASE_POINTS,
  ONLINE_WRONG_POINTS,
  ONLINE_SPEED_BONUS_MAX,
  ONLINE_STREAK_BONUS,
  ONLINE_ROUND_DURATION_MS,
  ONLINE_FIRST_CORRECT_WINDOW_MS,
  ONLINE_GUESS_COOLDOWN_MS,
  ModeId,
  EVENTS,
} from '../types/shared';
import { SessionSnapshot, SessionMode } from '../types/shared';
import { checkGuess } from './AnswerMatcher';

interface RoundRecord {
  questionId: string;
  correctPlayers: Set<string>;   // player IDs who answered correctly this round
}

interface PlayerGuardState {
  lastGuessAt: number;           // unix ms
  correctThisRound: boolean;
}

export class RoundEngine {
  private io: Server;
  private roomCode: string;
  private snapshot: SessionSnapshot;
  private sessionAssets: Map<string, { key: string; mimeType: string; data: string }>;

  // Progression
  private modeIndex = 0;        // index into snapshot.selectedModes
  private roundIndex = 0;        // index within current level's questions
  private roundPhase: RoundPhase = 'intro';

  // Timer handles
  private roundTimer: ReturnType<typeof setTimeout> | null = null;
  private continuationTimer: ReturnType<typeof setTimeout> | null = null;

  // Round bookkeeping
  private roundRecord: RoundRecord | null = null;
  private playerGuards = new Map<string, PlayerGuardState>();

  // Stats for final awards
  private stats = {
    fastestGuesserId: null as string | null,
    fastestGuessMs: Infinity,
    longestStreakPlayerId: null as string | null,
    longestStreak: 0,
    correctCountByPlayer: new Map<string, number>(),
  };

  constructor(
    io: Server,
    roomCode: string,
    snapshot: SessionSnapshot,
    sessionAssets: Map<string, { key: string; mimeType: string; data: string }>,
    private players: OnlinePlayer[],  // by-reference from GameRoom
    private hostId: string,
  ) {
    this.io = io;
    this.roomCode = roomCode;
    this.snapshot = snapshot;
    this.sessionAssets = sessionAssets;
  }

  // ── Public API called by GameRoom ─────────────────────────────────────────

  start() {
    this.modeIndex = 0;
    this.roundIndex = 0;
    this.beginMode();
  }

  handleGuess(playerId: string, guess: string) {
    if (this.roundPhase !== 'active' && this.roundPhase !== 'first_correct') return;

    const now = Date.now();
    const guard = this.playerGuards.get(playerId);

    // Rate-limit: enforce cooldown
    if (guard && now - guard.lastGuessAt < ONLINE_GUESS_COOLDOWN_MS) {
      this.emitToPlayer(playerId, EVENTS.GUESS_RESULT, {
        type: 'rate_limited',
        message: 'Too fast! Wait a moment.',
      });
      return;
    }

    // Already answered correctly this round
    if (guard?.correctThisRound) {
      this.emitToPlayer(playerId, EVENTS.GUESS_RESULT, {
        type: 'already_correct',
        message: 'You already got this one!',
      });
      return;
    }

    // Update guard state
    this.playerGuards.set(playerId, {
      lastGuessAt: now,
      correctThisRound: guard?.correctThisRound ?? false,
    });

    const serverQ = this.currentServerQuestion();
    if (!serverQ) return;

    const result = checkGuess(guess, serverQ.answer, serverQ.aliases, serverQ.type);

    if (result.matched) {
      this.handleCorrectGuess(playerId, now);
    } else {
      // Wrong guess: -2 points
      this.adjustScore(playerId, ONLINE_WRONG_POINTS);

      // Update last guess time
      const g = this.playerGuards.get(playerId)!;
      this.playerGuards.set(playerId, { ...g, lastGuessAt: now });

      // Near-miss: let just this player know they're close (no answer reveal)
      if (result.isNearMiss) {
        this.emitToPlayer(playerId, EVENTS.GUESS_RESULT, {
          type: 'near_miss',
          message: "Very close! Try again.",
        });
      } else {
        this.emitToPlayer(playerId, EVENTS.GUESS_RESULT, {
          type: 'wrong',
          points: ONLINE_WRONG_POINTS,
        });
      }

      // Broadcast wrong guess to feed (without answer)
      const player = this.players.find(p => p.id === playerId);
      this.io.to(this.roomCode).emit(EVENTS.ACTIVITY_FEED, {
        type: 'wrong_guess',
        playerName: player?.name ?? 'Someone',
        guess: guess, // wrong guess is safe to show
      });
    }
  }

  handleImageRequest(playerId: string, imageKey: string) {
    // Only serve path:-prefixed keys as public references, others from session store
    if (imageKey.startsWith('path:')) {
      // Client should load from /public/ directly — no server action needed
      return;
    }
    const asset = this.sessionAssets.get(imageKey);
    if (!asset) return;

    // Send image data only to the requesting player (avoid re-broadcasting to all)
    this.emitToPlayer(playerId, EVENTS.IMAGE_DATA, {
      key: imageKey,
      mimeType: asset.mimeType,
      data: asset.data,
    });
  }

  destroy() {
    this.clearTimers();
  }

  forceReveal() {
    if (this.roundPhase !== 'active' && this.roundPhase !== 'first_correct') return;
    this.endRound();
  }

  // ── Private: Level / Round Flow ───────────────────────────────────────────

  private beginMode() {
    const levelId = this.currentModeId();
    if (!levelId) { this.endGame(); return; }

    this.roundIndex = 0;
    this.roundPhase = 'intro';

    this.broadcastRoomState();

    // Brief intro delay then start first round
    setTimeout(() => this.beginRound(), 4000);
  }

  private beginRound() {
    this.clearTimers();
    this.roundPhase = 'active';
    this.roundRecord = {
      questionId: this.currentServerQuestion()?.id ?? '',
      correctPlayers: new Set(),
    };
    this.playerGuards.clear();

    const clientQ = this.currentClientQuestion();
    const modeId = this.snapshot.selectedModes[this.modeIndex];
    const modeTimerSec = this.snapshot.modes[modeId]?.modeDefinition?.timerSeconds;
    const durationMs = (modeTimerSec ? modeTimerSec * 1000 : ONLINE_ROUND_DURATION_MS);
    const roundEndTimeMs = Date.now() + durationMs;

    console.log('TRACE [Backend ROUND_START emitting]');
    console.log(`- QID: ${clientQ?.id}`);
    console.log(`- client imageKey: ${clientQ?.imageKey}`);
    console.log(`- roundPhase: ${this.roundPhase}`);
    
    // Emit round start with player-safe question data only
    this.io.to(this.roomCode).emit(EVENTS.ROUND_START, {
      clientQuestion: clientQ,
      roundEndTimeMs,
      modeIndex: this.modeIndex,
      roundIndex: this.roundIndex,
      modeId: this.currentModeId(),
      totalRounds: this.currentMode()?.clientQuestions.length ?? 0,
    });

    // Authoritative timer
    this.roundTimer = setTimeout(() => this.endRound(), durationMs);
  }

  private handleCorrectGuess(playerId: string, answerTimeMs: number) {
    const serverQ = this.currentServerQuestion()!;
    const isFirstCorrect = this.roundRecord!.correctPlayers.size === 0;

    // Mark player as correct this round
    this.roundRecord!.correctPlayers.add(playerId);
    const g = this.playerGuards.get(playerId) ?? { lastGuessAt: Date.now(), correctThisRound: false };
    this.playerGuards.set(playerId, { ...g, correctThisRound: true, lastGuessAt: answerTimeMs });

    // ── Score calculation ──────────────────────────────────────────────────
    const player = this.players.find(p => p.id === playerId)!;

    // Speed bonus: proportional to how much time was left
    let speedBonus = 0;
    if (isFirstCorrect) {
      // For the first correct answer, compute from round start
      // roundEndTimeMs is not stored in engine directly, so we estimate:
      const modeId = this.snapshot.selectedModes[this.modeIndex];
      const modeTimerSec = this.snapshot.modes[modeId]?.modeDefinition?.timerSeconds;
      const durationMs = (modeTimerSec ? modeTimerSec * 1000 : ONLINE_ROUND_DURATION_MS);

      const timeLeft = durationMs - (answerTimeMs % durationMs);
      speedBonus = Math.round((timeLeft / durationMs) * ONLINE_SPEED_BONUS_MAX);
    }
    // Subsequent correct answers during 5s window get a fixed (smaller) base
    const basePoints = isFirstCorrect ? ONLINE_BASE_POINTS : Math.round(ONLINE_BASE_POINTS * 0.6);
    const streakBonus = player.streak > 0 ? ONLINE_STREAK_BONUS * Math.min(player.streak, 5) : 0;
    const totalPoints = basePoints + speedBonus + streakBonus;

    this.adjustScore(playerId, totalPoints);
    this.incrementStreak(playerId);

    // Update fastest guesser stats
    if (isFirstCorrect && answerTimeMs < this.stats.fastestGuessMs) {
      this.stats.fastestGuessMs = answerTimeMs;
      this.stats.fastestGuesserId = playerId;
    }

    // Update correct count
    const prev = this.stats.correctCountByPlayer.get(playerId) ?? 0;
    this.stats.correctCountByPlayer.set(playerId, prev + 1);

    // Tell just this player they were correct (no answer text yet)
    this.emitToPlayer(playerId, EVENTS.GUESS_RESULT, {
      type: 'correct',
      points: totalPoints,
      breakdown: { base: basePoints, speed: speedBonus, streak: streakBonus },
    });

    // Broadcast to feed (player name only, no answer text)
    const playerObj = this.players.find(p => p.id === playerId);
    this.io.to(this.roomCode).emit(EVENTS.ACTIVITY_FEED, {
      type: 'correct_guess',
      playerName: playerObj?.name ?? 'Someone',
      position: this.roundRecord!.correctPlayers.size,
    });

    // If first correct, start 5-second continuation window
    if (isFirstCorrect) {
      this.roundPhase = 'first_correct';
      const firstCorrectTimeMs = answerTimeMs;

      this.clearTimers(); // cancel main round timer
      this.broadcastRoomState(firstCorrectTimeMs);

      this.continuationTimer = setTimeout(
        () => this.endRound(),
        ONLINE_FIRST_CORRECT_WINDOW_MS
      );
    }
  }

  private endRound() {
    this.clearTimers();
    this.roundPhase = 'reveal';

    const serverQ = this.currentServerQuestion();

    // Reset streaks for players who didn't answer correctly
    for (const p of this.players) {
      if (!this.roundRecord?.correctPlayers.has(p.id)) {
        this.resetStreak(p.id);
      }
    }

    // Broadcast answer reveal + current scores
    this.io.to(this.roomCode).emit(EVENTS.ROUND_END, {
      revealedAnswer: serverQ?.answer ?? '',
      scores: this.getPlayerScores(),
    });

    // Advance to next round after a brief pause
    setTimeout(() => this.advanceRound(), 5000);
  }

  private advanceRound() {
    const level = this.currentMode();
    if (!level) return;

    const totalRounds = level.clientQuestions.length;

    if (this.roundIndex + 1 >= totalRounds) {
      // Level complete
      this.io.to(this.roomCode).emit(EVENTS.LEVEL_END, {
        modeId: this.currentModeId(),
        scores: this.getPlayerScores(),
      });

      this.modeIndex++;
      if (this.modeIndex >= this.snapshot.selectedModes.length) {
        setTimeout(() => this.endGame(), 3000);
      } else {
        setTimeout(() => this.beginMode(), 4000);
      }
    } else {
      this.roundIndex++;
      this.beginRound();
    }
  }

  private endGame() {
    const finalScores = this.getPlayerScores().sort((a, b) => b.score - a.score);

    // Assign ranks (tie = same rank)
    let rank = 1;
    for (let i = 0; i < finalScores.length; i++) {
      if (i > 0 && finalScores[i].score < finalScores[i - 1].score) {
        rank = i + 1;
      }
      finalScores[i].rank = rank;
    }

    // Secondary awards
    const awards: Record<string, string> = {};
    if (this.stats.fastestGuesserId) {
      awards[this.stats.fastestGuesserId] = 'Fastest Guesser ⚡';
    }

    let longestStreak = 0;
    let longestStreakId: string | null = null;
    for (const p of this.players) {
      if (p.streak > longestStreak) {
        longestStreak = p.streak;
        longestStreakId = p.id;
      }
    }
    if (longestStreakId && longestStreak > 1) {
      awards[longestStreakId] = `Longest Streak 🔥 (${longestStreak})`;
    }

    let mostCorrect = 0;
    let mostCorrectId: string | null = null;
    for (const [id, count] of this.stats.correctCountByPlayer) {
      if (count > mostCorrect) {
        mostCorrect = count;
        mostCorrectId = id;
      }
    }
    if (mostCorrectId && mostCorrect > 0) {
      const existing = awards[mostCorrectId];
      if (!existing) awards[mostCorrectId] = `Most Correct 🎯 (${mostCorrect})`;
    }

    this.io.to(this.roomCode).emit(EVENTS.GAME_OVER, {
      finalScores,
      awards,
    });

    this.roundPhase = 'reveal';
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private currentModeId(): ModeId | undefined {
    return this.snapshot.selectedModes[this.modeIndex];
  }

  private currentMode(): SessionMode | undefined {
    const id = this.currentModeId();
    return id ? this.snapshot.modes[id] : undefined;
  }

  private currentServerQuestion(): ServerQuestion | undefined {
    return this.currentMode()?.serverQuestions[this.roundIndex];
  }

  private currentClientQuestion(): ClientQuestion | undefined {
    return this.currentMode()?.clientQuestions[this.roundIndex];
  }

  private adjustScore(playerId: string, delta: number) {
    const p = this.players.find(p => p.id === playerId);
    if (p) {
      p.score = Math.max(0, p.score + delta); // floor at 0
    }
  }

  private incrementStreak(playerId: string) {
    const p = this.players.find(p => p.id === playerId);
    if (!p) return;
    p.streak++;
    // Track longest streak
    if (p.streak > this.stats.longestStreak) {
      this.stats.longestStreak = p.streak;
      this.stats.longestStreakPlayerId = playerId;
    }
  }

  private resetStreak(playerId: string) {
    const p = this.players.find(p => p.id === playerId);
    if (p) p.streak = 0;
  }

  private getPlayerScores() {
    return this.players.map(p => ({
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      score: p.score,
      streak: p.streak,
      rank: 0,
    }));
  }

  private clearTimers() {
    if (this.roundTimer) { clearTimeout(this.roundTimer); this.roundTimer = null; }
    if (this.continuationTimer) { clearTimeout(this.continuationTimer); this.continuationTimer = null; }
  }

  private emitToPlayer(playerId: string, event: string, data: unknown) {
    // Find socket ID for this player — we'll look it up in the room
    this.io.to(`player_${playerId}`).emit(event, data);
  }

  public broadcastRoomState(firstCorrectTimeMs?: number) {
    const clientQ = this.currentClientQuestion();
    const modeId = this.snapshot.selectedModes[this.modeIndex];
    const modeTimerSec = this.snapshot.modes[modeId]?.modeDefinition?.timerSeconds;
    const durationMs = (modeTimerSec ? modeTimerSec * 1000 : ONLINE_ROUND_DURATION_MS);

    const roundEndTimeMs = Date.now() + durationMs;

    this.io.to(this.roomCode).emit('room_state_update', {
      code: this.roomCode,
      hostId: this.hostId,
      players: this.players,
      phase: 'playing',
      currentModeId: this.currentModeId(),
      currentModeIndex: this.modeIndex,
      currentRoundNumber: this.roundIndex + 1,
      totalRoundsInMode: this.currentMode()?.clientQuestions.length ?? 0,
      roundPhase: this.roundPhase,
      roundEndTimeMs: this.roundPhase === 'active' ? roundEndTimeMs : undefined,
      firstCorrectTimeMs,
      currentClientQuestion: clientQ,
    });
  }
}
