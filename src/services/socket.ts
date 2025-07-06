import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Types for socket events
export interface LogMessage {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  container: string;
}

export interface SocketEvents {
  'log': (data: LogMessage) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'error': (error: Error) => void;
}

// Socket connection manager
class SocketManager {
  private socket: Socket | null = null;
  private containerName: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to container logs WebSocket
   */
  connect(containerName: string, logFile?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.disconnect();
      }

      this.containerName = containerName;
      // Use relative URL for socket.io (handled by reverse proxy)

      // Connect to the main Socket.IO server - use the same logic as API calls
      const socketUrl = import.meta.env.VITE_API_URL || '/';
      const token = localStorage.getItem('auth_token');
      
      this.socket = io(socketUrl, {
        path: '/socket.io', // Explicitly set the Socket.IO path
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        withCredentials: true, // Enable credentials for cross-origin
        auth: {
          token: token || ''
        }
      });

      // Set up event listeners
      this.socket.on('connect', async () => {
        console.log(`Connected to Socket.IO server for container: ${containerName}`);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        try {
          // Start container log streaming for this container
          const socket = this.socket;
          if (socket) {
            if (logFile) {
              // Start streaming specific log file
              socket.emit('start-ark-logs', { container: containerName, logFile });
            } else {
              // Start streaming container logs
              socket.emit('start-container-logs', { container: containerName });
            }
          }
          
          resolve();
        } catch (error: unknown) {
          console.error('Error in socket connection setup:', error);
          resolve();
        }
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log(`Disconnected from logs: ${reason}`);
        if (reason === 'io server disconnect') {
          // Server disconnected us, don't try to reconnect
          this.socket = null;
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error: Error) => {
        console.error('Socket error:', error);
      });

      // Handle reconnection
      this.socket.on('disconnect', (reason: string) => {
        if (reason === 'io client disconnect') {
          // Client disconnected, don't reconnect
          return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          setTimeout(() => {
            if (this.containerName) {
              this.connect(this.containerName).catch(console.error);
            }
          }, this.reconnectDelay);
          
          // Exponential backoff
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        } else {
          console.error('Max reconnection attempts reached');
        }
      });
    });
  }

  /**
   * Switch to streaming a different log file
   */
  switchLogFile(logFile: string): void {
    if (this.socket?.connected && this.containerName) {
      // Stop current streaming
      this.socket.emit('stop-container-logs');
      this.socket.emit('stop-ark-logs');
      
      // Start streaming the new log file
      this.socket.emit('start-ark-logs', { container: this.containerName, logFile });
    }
  }

  /**
   * Switch to streaming container logs
   */
  switchToContainerLogs(): void {
    if (this.socket?.connected && this.containerName) {
      // Stop current streaming
      this.socket.emit('stop-container-logs');
      this.socket.emit('stop-ark-logs');
      
      // Start streaming container logs
      this.socket.emit('start-container-logs', { container: this.containerName });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        // Stop all log streaming
        this.socket.emit('stop-container-logs');
        this.socket.emit('stop-ark-logs');
        
        // Disconnect the socket
        this.socket.disconnect();
        this.socket = null;
        this.containerName = null;
      } catch (error: unknown) {
        console.error('Error disconnecting socket:', error);
        // Don't throw error, just log it
      }
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.containerName = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to container log events
   */
  onContainerLog(callback: (data: LogMessage) => void): void {
    if (this.socket) {
      this.socket.on('container-log-data', (data) => {
        // Transform the Socket.IO data format to match our LogMessage interface
        const logMessage: LogMessage = {
          timestamp: data.timestamp,
          level: 'info', // Default level since Docker logs don't include level info
          message: data.data,
          container: this.containerName || 'unknown'
        };
        callback(logMessage);
      });
    }
  }

  /**
   * Subscribe to ARK server log events
   */
  onArkLog(callback: (data: LogMessage) => void): void {
    if (this.socket) {
      this.socket.on('ark-log-data', (data) => {
        // Transform the Socket.IO data format to match our LogMessage interface
        const logMessage: LogMessage = {
          timestamp: data.timestamp,
          level: 'info', // Default level since ARK logs don't include level info
          message: data.data,
          container: this.containerName || 'unknown'
        };
        callback(logMessage);
      });
    }
  }

  /**
   * Unsubscribe from container log events
   */
  offContainerLog(): void {
    if (this.socket) {
      this.socket.off('container-log-data');
    }
  }

  /**
   * Unsubscribe from ARK log events
   */
  offArkLog(): void {
    if (this.socket) {
      this.socket.off('ark-log-data');
    }
  }

  /**
   * Subscribe to connection events
   */
  onConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  /**
   * Subscribe to disconnection events
   */
  onDisconnect(callback: (reason: string) => void): void {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  /**
   * Subscribe to error events
   */
  onError(callback: (error: Error) => void): void {
    if (this.socket) {
      this.socket.on('connect_error', callback);
      this.socket.on('error', callback);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current container name
   */
  getCurrentContainer(): string | null {
    return this.containerName;
  }
}

// Create singleton instance
export const socketManager = new SocketManager();

// Export convenience functions
export const socketService = {
  connect: (containerName: string, logFile?: string) => socketManager.connect(containerName, logFile),
  disconnect: () => socketManager.disconnect(),
  switchLogFile: (logFile: string) => socketManager.switchLogFile(logFile),
  switchToContainerLogs: () => socketManager.switchToContainerLogs(),
  onContainerLog: (callback: (data: LogMessage) => void) => socketManager.onContainerLog(callback),
  onArkLog: (callback: (data: LogMessage) => void) => socketManager.onArkLog(callback),
  offContainerLog: () => socketManager.offContainerLog(),
  offArkLog: () => socketManager.offArkLog(),
  onConnect: (callback: () => void) => socketManager.onConnect(callback),
  onDisconnect: (callback: (reason: string) => void) => socketManager.onDisconnect(callback),
  onError: (callback: (error: Error) => void) => socketManager.onError(callback),
  isConnected: () => socketManager.isConnected(),
  getCurrentContainer: () => socketManager.getCurrentContainer(),
};

export default socketService; 