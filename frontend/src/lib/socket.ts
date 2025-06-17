import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(gameCode: string, playerName?: string) {
    if (this.socket?.connected) {
      return;
    }

    const socketUrl = API_BASE_URL.replace('/api', '');
    const token = localStorage.getItem('leaderToken');

    this.socket = io(socketUrl, {
      auth: {
        token,
        gameCode,
        playerName
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to game:', gameCode);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game');
    });

    // Set up event forwarders
    this.socket.on('game_update', (data) => {
      this.emit('game_update', data);
    });

    this.socket.on('player_joined', (data) => {
      this.emit('player_joined', data);
    });

    this.socket.on('player_left', (data) => {
      this.emit('player_left', data);
    });

    this.socket.on('update_requested', () => {
      this.emit('update_requested');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  requestUpdate() {
    this.socket?.emit('request_update');
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const socketService = new SocketService();