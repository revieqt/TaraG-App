import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io('https://tarag-backend.onrender.com');
    
    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      this.isConnected = true;
      
      // Join user to their personal room
      this.socket?.emit('join-user', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  onNewNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('new-notification', callback);
    }
  }

  offNewNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.off('new-notification', callback);
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService(); 