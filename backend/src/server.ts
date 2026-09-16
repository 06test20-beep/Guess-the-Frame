import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { RoomManager } from './gameEngine/RoomManager';
import studioRoutes from './routes/studio';

const app = express();
app.use(cors());
app.use(express.json());

// Serve extracted frames statically so the frontend can display them
app.use('/tmp', express.static(path.join(process.cwd(), 'tmp')));

// Mount studio routes
app.use('/api/studio', studioRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e6 // 5 MB
});

const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // When a client first connects or reconnects, they provide a playerID
  socket.on('join_server', (playerId: string) => {
    roomManager.handlePlayerConnect(socket, playerId);
  });

  socket.on('create_room', (data, callback) => {
    roomManager.handleCreateRoom(socket, data, callback);
  });

  socket.on('join_room', (data, callback) => {
    roomManager.handleJoinRoom(socket, data, callback);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    roomManager.handlePlayerDisconnect(socket);
  });

  // Forward all game actions to the room manager
  socket.on('game_action', (action, callback) => {
    roomManager.handleGameAction(socket, action, callback);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Guess The Frame Online Backend running on port ${PORT}`);
});
