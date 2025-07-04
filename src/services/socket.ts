import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import axios from 'axios';

// Check if we're in frontend-only mode
const FRONTEND_ONLY_MODE = import.meta.env.VITE_FRONTEND_ONLY === 'true';

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
  connect(containerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.disconnect();
      }

      this.containerName = containerName;
      // Use relative URL for socket.io (handled by reverse proxy)

      // Connect to the main Socket.IO server
      this.socket = io('/socket.io', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        withCredentials: true, // Enable credentials for cross-origin
      });

      // Set up event listeners
      this.socket.on('connect', async () => {
        console.log(`Connected to Socket.IO server for container: ${containerName}`);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        try {
          // Join the logs room for this container
          const socket = this.socket;
          if (socket) {
            socket.emit('join-logs', containerName);
          }
          
          // Only attempt log streaming API call if not in frontend-only mode
          if (!FRONTEND_ONLY_MODE) {
            const token = localStorage.getItem('auth_token');
            if (!token) {
              console.warn('No authentication token found for log streaming');
            } else {
              try {
                // First check if the backend is available
                await axios.get(`/health`, { timeout: 5000 });
                
                const response = await axios.post(
                  `/api/containers/${encodeURIComponent(containerName)}/logs/stream`,
                  { tail: 100 },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    timeout: 10000
                  }
                );
                
                if (response.status !== 200) {
                  console.warn(`Log streaming API returned status: ${response.status}`);
                } else {
                  console.log('Log streaming started successfully');
                }
              } catch (apiError: unknown) {
                if (typeof apiError === 'object' && apiError !== null && 'code' in apiError) {
                  const err = apiError as { code?: string; message?: string };
                  if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                    console.warn('Backend API is not available, log streaming will be disabled:', err.message);
                  } else {
                    console.warn('Log streaming API call failed, but socket connection is still active:', err.message);
                  }
                } else {
                  console.warn('Log streaming API call failed, but socket connection is still active:', apiError);
                }
                // Don't fail the entire connection if the API call fails
              }
            }
          }
          
          resolve();
        } catch (error: unknown) {
          console.error('Error in socket connection setup:', error);
          // Don't reject the entire connection if log streaming fails
          // Just log the error and continue with socket connection
          console.warn('Socket setup failed, but connection attempt continues');
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
   * Disconnect from WebSocket
   */
  async disconnect(): Promise<void> {
    if (this.socket && this.containerName) {
      try {
        // Leave the logs room
        const socket = this.socket;
        const containerName = this.containerName;
        if (socket && containerName) {
          socket.emit('leave-logs', containerName);
        }
        
        // Stop log streaming via API using axios for consistency (only if not in frontend-only mode)
        if (!FRONTEND_ONLY_MODE) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            try {
              await axios.post(
                `/api/containers/${encodeURIComponent(this.containerName)}/logs/stop-stream`,
                {},
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  timeout: 5000
                }
              );
            } catch (error: unknown) {
              console.warn('Failed to stop log streaming via API:', error);
            }
          }
        }
      } catch (error: unknown) {
        console.error('Error stopping log streaming:', error);
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
   * Subscribe to log events
   */
  onLog(callback: (data: LogMessage) => void): void {
    if (this.socket) {
      this.socket.on('log', callback);
    }
  }

  /**
   * Unsubscribe from log events
   */
  offLog(callback: (data: LogMessage) => void): void {
    if (this.socket) {
      this.socket.off('log', callback);
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
  connect: (containerName: string) => socketManager.connect(containerName),
  disconnect: () => socketManager.disconnect(),
  onLog: (callback: (data: LogMessage) => void) => socketManager.onLog(callback),
  offLog: (callback: (data: LogMessage) => void) => socketManager.offLog(callback),
  onConnect: (callback: () => void) => socketManager.onConnect(callback),
  onDisconnect: (callback: (reason: string) => void) => socketManager.onDisconnect(callback),
  onError: (callback: (error: Error) => void) => socketManager.onError(callback),
  isConnected: () => socketManager.isConnected(),
  getCurrentContainer: () => socketManager.getCurrentContainer(),
};

export default socketService; 