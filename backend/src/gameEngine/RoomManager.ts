import { Server, Socket } from 'socket.io';
import { GameRoom } from './GameRoom';
import { EVENTS } from '../types/shared';

export class RoomManager {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();
  // Maps socket.id -> { playerId, roomCode }
  private activeSockets: Map<string, { playerId: string; roomCode?: string }> = new Map();
  // Maps playerId -> socket.id (for reconnection)
  private playerSockets: Map<string, string> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  handlePlayerConnect(socket: Socket, playerId: string) {
    // Check if this player was previously in a room (reconnection scenario)
    const prevSocketId = this.playerSockets.get(playerId);
    let roomCode: string | undefined;

    if (prevSocketId) {
      // Find the room this player was in from the old socket's data
      const prevData = this.activeSockets.get(prevSocketId);
      roomCode = prevData?.roomCode;

      // Clean up the stale old socket entry
      this.activeSockets.delete(prevSocketId);
    }

    this.activeSockets.set(socket.id, { playerId, roomCode });
    this.playerSockets.set(playerId, socket.id);

    // Re-join the socket.io room with the new socket so broadcasts reach it
    if (roomCode) {
      const room = this.rooms.get(roomCode);
      if (room) {
        room.joinPlayer(playerId, null, socket);
        console.log(`[RoomManager] Player ${playerId} reconnected to room ${roomCode}`);
      }
    }
  }


  handlePlayerDisconnect(socket: Socket) {
    const data = this.activeSockets.get(socket.id);
    if (!data) return;

    this.activeSockets.delete(socket.id);
    // DO NOT delete this.playerSockets.get(data.playerId) here, 
    // it must persist for handlePlayerConnect to restore the connection.

    if (data.roomCode) {
      const room = this.rooms.get(data.roomCode);
      if (room) {
        room.handlePlayerDisconnect(data.playerId);
        // Clean up truly empty rooms (all players permanently gone)
        if (room.isEmpty()) {
          room.destroy();
          this.rooms.delete(data.roomCode);
          console.log(`[RoomManager] Cleaned up empty room ${data.roomCode}`);
        }
      }
    }
  }

  handleCreateRoom(socket: Socket, data: any, callback: Function) {
    const active = this.activeSockets.get(socket.id);
    if (!active) return callback({ error: 'Not identified. Call join_server first.' });

    const code = this.generateRoomCode();
    const room = new GameRoom(code, this.io, this);
    this.rooms.set(code, room);

    // Host joins automatically
    const joined = room.joinPlayer(active.playerId, data.player, socket);
    if (!joined) {
      this.rooms.delete(code);
      return callback({ error: 'Failed to join room.' });
    }
    active.roomCode = code;

    console.log(`[RoomManager] Room ${code} created by ${active.playerId}`);
    callback({ success: true, roomCode: code });
  }

  handleJoinRoom(socket: Socket, data: any, callback: Function) {
    const active = this.activeSockets.get(socket.id);
    if (!active) return callback({ error: 'Not identified. Call join_server first.' });

    const code = (data.roomCode || '').toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      // Room not found — could be server restart, send specific event for graceful UI
      socket.emit(EVENTS.ROOM_NOT_FOUND, {
        message: 'Room not found. It may have expired if the server restarted. Please create a new room.'
      });
      return callback({ error: 'Room not found.' });
    }

    const success = room.joinPlayer(active.playerId, data.player, socket);
    if (!success) {
      return callback({ error: 'Room is full or cannot be joined.' });
    }

    active.roomCode = code;
    console.log(`[RoomManager] Player ${active.playerId} joined room ${code}`);
    callback({ success: true, roomCode: code });
  }

  handleGameAction(socket: Socket, action: any, callback: Function) {
    const active = this.activeSockets.get(socket.id);
    if (!active || !active.roomCode) {
      return callback?.({ error: 'Not in a room.' });
    }

    const room = this.rooms.get(active.roomCode);
    if (!room) {
      // Room vanished (server restart scenario)
      socket.emit(EVENTS.ROOM_NOT_FOUND, {
        message: 'Your room is no longer available. The server may have restarted.'
      });
      return callback?.({ error: 'Room not found.' });
    }

    room.handleAction(active.playerId, action, callback ?? (() => {}));
  }
}
