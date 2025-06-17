import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface SocketUser {
  gameCode: string;
  isLeader: boolean;
  playerName?: string;
}

export class SocketService {
  private io: Server;
  private userSockets: Map<string, SocketUser> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const gameCode = socket.handshake.auth.gameCode;
      const playerName = socket.handshake.auth.playerName;

      if (!gameCode) {
        return next(new Error('Game code required'));
      }

      let isLeader = false;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          if (decoded.gameId) {
            isLeader = true;
          }
        } catch (error) {
          logger.warn('Invalid leader token in socket connection');
        }
      }

      this.userSockets.set(socket.id, { gameCode, isLeader, playerName });
      socket.join(gameCode);
      
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = this.userSockets.get(socket.id);
      if (!user) return;

      logger.info(`Socket connected: ${socket.id} to game ${user.gameCode}`);

      // Notify others in the game
      socket.to(user.gameCode).emit('player_joined', {
        playerName: user.playerName,
        isLeader: user.isLeader
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        
        if (user) {
          socket.to(user.gameCode).emit('player_left', {
            playerName: user.playerName,
            isLeader: user.isLeader
          });
          this.userSockets.delete(socket.id);
        }
      });

      // Handle live updates
      socket.on('request_update', () => {
        socket.to(user.gameCode).emit('update_requested');
      });
    });
  }

  // Emit game updates to all connected clients
  public emitGameUpdate(gameCode: string, eventType: string, data: any) {
    this.io.to(gameCode).emit('game_update', {
      type: eventType,
      data,
      timestamp: new Date()
    });
  }

  // Emit to specific game room
  public emitToGame(gameCode: string, event: string, data: any) {
    this.io.to(gameCode).emit(event, data);
  }
}