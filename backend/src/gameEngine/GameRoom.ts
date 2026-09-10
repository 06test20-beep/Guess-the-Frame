import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { RoundEngine } from './RoundEngine';
import { buildSessionSnapshot, HostGamePayload } from './SessionSnapshot';
import { OnlinePlayer, EVENTS, LevelId } from '../types/shared';

export class GameRoom {
  code: string;
  io: Server;
  manager: RoomManager;
  players: OnlinePlayer[] = [];
  hostId: string | null = null;
  state: 'lobby' | 'playing' | 'results' = 'lobby';

  // Socket ID → player ID mapping (for emitting to individual players)
  private socketToPlayer = new Map<string, string>();
  private playerToSocket = new Map<string, string>();

  private roundEngine: RoundEngine | null = null;

  // Immutable session snapshot — set once on game start, never mutated
  private sessionAssets = new Map<string, { key: string; mimeType: string; data: string }>();

  constructor(code: string, io: Server, manager: RoomManager) {
    this.code = code;
    this.io = io;
    this.manager = manager;
  }

  // ── Player management ─────────────────────────────────────────────────────

  joinPlayer(playerId: string, playerInfo: any, socket: Socket): boolean {
    if (
      this.players.length >= 10 &&
      !this.players.find(p => p.id === playerId)
    ) {
      return false; // Room full
    }

    // Join the socket.io room AND a player-specific room for direct messaging
    socket.join(this.code);
    socket.join(`player_${playerId}`);

    this.socketToPlayer.set(socket.id, playerId);
    this.playerToSocket.set(playerId, socket.id);

    let p = this.players.find(p => p.id === playerId);
    if (p) {
      // Reconnect: restore connection, update info if provided
      p.connected = true;
      if (playerInfo?.name) p.name = playerInfo.name;
      if (playerInfo?.avatarId) p.avatarId = playerInfo.avatarId;
    } else {
      p = {
        id: playerId,
        name: this.getUniqueName(playerInfo?.name ?? 'Player'),
        avatarId: playerInfo?.avatarId ?? '1',
        isReady: false,
        score: 0,
        streak: 0,
        connected: true,
        joinedAt: Date.now(),
      };
      this.players.push(p);
    }

    // Elect host if needed — deterministically: earliest joinedAt among connected players
    this.electHost();

    // If a game is running, sync this reconnecting player to current state
    if (this.state === 'playing') {
      this.broadcastState();
    } else {
      this.broadcastState();
    }

    return true;
  }

  handlePlayerDisconnect(playerId: string) {
    const p = this.players.find(p => p.id === playerId);
    if (p) {
      p.connected = false;
      p.isReady = false;
    }

    // Remove socket mappings
    for (const [sid, pid] of this.socketToPlayer) {
      if (pid === playerId) {
        this.socketToPlayer.delete(sid);
        break;
      }
    }
    this.playerToSocket.delete(playerId);

    // Host migration: re-elect deterministically
    if (this.hostId === playerId) {
      this.electHost();
    }

    this.broadcastState();
  }

  isEmpty() {
    return !this.players.some(p => p.connected);
  }

  // ── Action handler ────────────────────────────────────────────────────────

  handleAction(playerId: string, action: any, callback: Function) {
    switch (action.type) {
      case 'TOGGLE_READY': {
        if (this.state !== 'lobby') return;
        const p = this.players.find(p => p.id === playerId);
        if (p) {
          p.isReady = !p.isReady;
          this.broadcastState();
        }
        callback({ success: true });
        break;
      }

      case 'START_GAME': {
        if (playerId !== this.hostId) return callback({ error: 'Only the host can start the game' });
        if (this.state !== 'lobby') return callback({ error: 'Game already started' });

        const connected = this.players.filter(p => p.connected);
        if (connected.length < 2) return callback({ error: 'Need at least 2 players' });
        if (connected.some(p => !p.isReady)) return callback({ error: 'Not everyone is ready' });

        const payload = action.payload as HostGamePayload;
        if (!payload?.selectedModes?.length) return callback({ error: 'No games selected' });

        // Build immutable session snapshot
        const { snapshot, assets } = buildSessionSnapshot(payload, (modeId: string) => {
          // Host is sending all data; no server-side defaults needed here
          // Return empty — the payload should contain all modes
          return [];
        });

        this.sessionAssets = assets;
        this.state = 'playing';

        // Reset all player scores for this session
        for (const p of this.players) {
          p.score = 0;
          p.streak = 0;
        }

        // Create and start the authoritative round engine
        this.roundEngine = new RoundEngine(
          this.io,
          this.code,
          snapshot,
          assets,
          this.players,
          this.hostId!,
        );

        this.broadcastState();
        this.roundEngine.start();

        callback({ success: true });
        break;
      }

      case 'KICK_PLAYER': {
        if (playerId !== this.hostId) return callback({ error: 'Only the host can kick players' });
        const targetId = action.payload as string;
        if (targetId === playerId) return callback({ error: 'Cannot kick yourself' });

        this.players = this.players.filter(p => p.id !== targetId);
        this.io.to(this.code).emit(EVENTS.PLAYER_KICKED, targetId);
        this.broadcastState();
        callback({ success: true });
        break;
      }

      case 'SUBMIT_GUESS': {
        if (!this.roundEngine) return callback({ error: 'No active game' });
        const guess = (action.payload as string) ?? '';
        this.roundEngine.handleGuess(playerId, guess);
        callback({ success: true });
        break;
      }

      case 'REQUEST_IMAGE': {
        if (!this.roundEngine) return;
        const imageKey = action.payload as string;
        this.roundEngine.handleImageRequest(playerId, imageKey);
        callback({ success: true });
        break;
      }

      default:
        callback({ error: `Unknown action: ${action.type}` });
    }
  }

  // ── Host election ─────────────────────────────────────────────────────────

  /**
   * Deterministic host election:
   * The connected player with the earliest joinedAt timestamp becomes host.
   * This ensures host migration is predictable and server-controlled.
   */
  private electHost() {
    const connected = this.players
      .filter(p => p.connected)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    this.hostId = connected.length > 0 ? connected[0].id : null;
  }

  // ── State broadcast ───────────────────────────────────────────────────────

  broadcastState() {
    this.io.to(this.code).emit(EVENTS.ROOM_STATE, {
      code: this.code,
      hostId: this.hostId,
      players: this.players,
      state: this.state,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getUniqueName(desiredName: string): string {
    let name = desiredName.trim() || 'Player';
    let suffix = 1;
    let finalName = name;

    while (this.players.find(p => p.name === finalName)) {
      suffix++;
      finalName = `${name} #${suffix}`;
    }

    return finalName;
  }

  destroy() {
    if (this.roundEngine) {
      this.roundEngine.destroy();
      this.roundEngine = null;
    }
  }
}
