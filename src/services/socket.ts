import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Types for socket events
export interface LogMessage {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  container: string;
}

// Job progress types
export interface JobProgress {
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  message: string;
  step?: string;
  error?: string;
  result?: any;
}

export interface SocketEvents {
  'log': (data: LogMessage) => void;
  'job-progress': (data: JobProgress) => void;
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
   * Check if the backend server is available
   */
  private async checkBackendAvailability(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Connect to container logs WebSocket
   */
  connect(containerName: string, logFile?: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.socket?.connected) {
        this.disconnect();
      }

      this.containerName = containerName;
      // Use relative URL for socket.io (handled by reverse proxy)

      // Connect to the main Socket.IO server - use the same logic as API calls
      let socketUrl = import.meta.env.VITE_API_URL;
      
      // If VITE_API_URL is not set, determine the correct URL based on environment
      if (!socketUrl) {
        if (import.meta.env.MODE === 'development') {
          // In development, use localhost:4000 (backend port)
          socketUrl = 'http://localhost:4000';
        } else {
          // In production, use the current origin
          socketUrl = window.location.origin;
        }
      }
      
      // Ensure the URL doesn't end with a trailing slash for Socket.IO
      socketUrl = socketUrl.replace(/\/$/, '');
      
      const token = localStorage.getItem('auth_token');
      
      console.log('Socket.IO connecting to:', socketUrl);
      console.log('Socket.IO auth token:', token ? 'present' : 'missing');
      console.log('Environment:', import.meta.env.MODE);
      console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
      
      // Check if backend is available before attempting Socket.IO connection
      const backendAvailable = await this.checkBackendAvailability(socketUrl);
      if (!backendAvailable) {
        console.warn('Backend server is not available, skipping Socket.IO connection');
        console.warn('Live log updates will not be available');
        resolve(); // Resolve without error to allow the app to continue
        return;
      }
      
      this.socket = io(socketUrl, {
        path: '/socket.io/', // Ensure trailing slash for Socket.IO path
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        withCredentials: true, // Enable credentials for cross-origin
        auth: {
          token: token || ''
        },
        // Add better error handling
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      // Set up event listeners
      this.socket.on('connect', async () => {
        console.log(`✅ Socket.IO connected successfully for container: ${containerName}`);
        console.log(`Socket ID: ${this.socket?.id}`);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        try {
          // Start container log streaming for this container
          const socket = this.socket;
          if (socket) {
            if (logFile) {
              // Start streaming specific log file for ARK servers
              socket.emit('start-ark-logs', { serverName: containerName, logFileName: logFile });
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
        console.log(`❌ Socket.IO disconnected: ${reason}`);
        if (reason === 'io server disconnect') {
          // Server disconnected us, don't try to reconnect
          this.socket = null;
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('❌ Socket.IO connection error:', error);
        console.error('Connection details:', {
          url: socketUrl,
          hasToken: !!token,
          error: error.message
        });
        
        // If this is a timeout error, provide helpful information
        if (error.message.includes('timeout')) {
          console.error('Socket.IO timeout - this usually means:');
          console.error('1. The backend server is not running on port 4000');
          console.error('2. The backend server is not configured for Socket.IO');
          console.error('3. There is a network/firewall issue');
          console.error('4. The CORS configuration is incorrect');
        }
        
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
      this.socket.emit('start-ark-logs', { serverName: this.containerName, logFileName: logFile });
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
   * Switch to streaming server logs (ARK server logs)
   */
  switchToServerLogs(serverName: string): void {
    if (this.socket?.connected) {
      // Stop current streaming
      this.socket.emit('stop-container-logs');
      this.socket.emit('stop-ark-logs');
      
      // Start streaming ARK server logs
      this.socket.emit('start-ark-logs', { serverName, logFileName: 'shootergame.log' });
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
    
    // Clear any mock log intervals
    if ((this as any).mockLogInterval) {
      clearInterval((this as any).mockLogInterval);
      (this as any).mockLogInterval = null;
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
    } else {
      // Fallback: provide mock log updates when Socket.IO is not available
      console.warn('Socket.IO not available, using mock log updates');
      const mockInterval = setInterval(() => {
        const mockLog: LogMessage = {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `[Mock] Container ${this.containerName} log entry - Socket.IO not available`,
          container: this.containerName || 'unknown'
        };
        callback(mockLog);
      }, 5000); // Send mock log every 5 seconds
      
      // Store the interval so we can clear it later
      (this as any).mockLogInterval = mockInterval;
    }
  }

  /**
   * Subscribe to ARK server log events
   */
  onArkLog(callback: (data: LogMessage) => void): void {
    if (this.socket) {
      this.socket.on('ark-log-data', (data) => {
        // The backend now sends properly formatted LogMessage data
        const logMessage: LogMessage = {
          timestamp: data.timestamp,
          level: data.level || 'info',
          message: data.message,
          container: data.container || this.containerName || 'unknown'
        };
        callback(logMessage);
      });
    }
  }

  /**
   * Subscribe to server log events (alias for onArkLog)
   */
  onServerLog(callback: (data: LogMessage) => void): void {
    this.onArkLog(callback);
  }

  /**
   * Subscribe to job progress events
   */
  onJobProgress(callback: (data: JobProgress) => void): void {
    if (this.socket) {
      this.socket.on('job-progress', (data) => {
        callback(data);
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
   * Unsubscribe from server log events (alias for offArkLog)
   */
  offServerLog(): void {
    this.offArkLog();
  }

  /**
   * Unsubscribe from job progress events
   */
  offJobProgress(): void {
    if (this.socket) {
      this.socket.off('job-progress');
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

  /**
   * Connect to system logs WebSocket
   */
  connectToSystemLogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.disconnect();
      }

      // Use the same URL logic as the main connection
      let socketUrl = import.meta.env.VITE_API_URL;
      
      // If VITE_API_URL is not set, determine the correct URL based on environment
      if (!socketUrl) {
        if (import.meta.env.MODE === 'development') {
          // In development, use localhost:4000 (backend port)
          socketUrl = 'http://localhost:4000';
        } else {
          // In production, use the current origin
          socketUrl = window.location.origin;
        }
      }
      
      // Ensure the URL doesn't end with a trailing slash for Socket.IO
      socketUrl = socketUrl.replace(/\/$/, '');
      
      const token = localStorage.getItem('auth_token');
      
      this.socket = io(socketUrl, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        withCredentials: true,
        auth: {
          token: token || ''
        }
      });

      // Set up event listeners
      this.socket.on('connect', async () => {
        console.log('Connected to Socket.IO server for system logs');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        try {
          // Start system log streaming
          const socket = this.socket;
          if (socket) {
            socket.emit('start-system-logs');
          }
          
          resolve();
        } catch (error: unknown) {
          console.error('Error in system logs connection setup:', error);
          resolve();
        }
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log(`Disconnected from system logs: ${reason}`);
        if (reason === 'io server disconnect') {
          this.socket = null;
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('System logs socket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error: Error) => {
        console.error('System logs socket error:', error);
      });

      // Handle reconnection
      this.socket.on('disconnect', (reason: string) => {
        if (reason === 'io client disconnect') {
          return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect system logs (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          setTimeout(() => {
            this.connectToSystemLogs().catch(console.error);
          }, this.reconnectDelay);
          
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        } else {
          console.error('Max reconnection attempts reached for system logs');
        }
      });
    });
  }

  /**
   * Subscribe to system log events
   */
  onSystemLog(callback: (data: LogMessage) => void): void {
    if (this.socket) {
      this.socket.on('system-log-data', (data) => {
        const logMessage: LogMessage = {
          timestamp: data.timestamp,
          level: data.level,
          message: data.message,
          container: 'system'
        };
        callback(logMessage);
      });
    }
  }

  /**
   * Unsubscribe from system log events
   */
  offSystemLog(): void {
    if (this.socket) {
      this.socket.off('system-log-data');
    }
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
  switchToServerLogs: (serverName: string) => socketManager.switchToServerLogs(serverName),
  onContainerLog: (callback: (data: LogMessage) => void) => socketManager.onContainerLog(callback),
  onArkLog: (callback: (data: LogMessage) => void) => socketManager.onArkLog(callback),
  onServerLog: (callback: (data: LogMessage) => void) => socketManager.onServerLog(callback),
  onJobProgress: (callback: (data: JobProgress) => void) => socketManager.onJobProgress(callback),
  offContainerLog: () => socketManager.offContainerLog(),
  offArkLog: () => socketManager.offArkLog(),
  offServerLog: () => socketManager.offServerLog(),
  offJobProgress: () => socketManager.offJobProgress(),
  onConnect: (callback: () => void) => socketManager.onConnect(callback),
  onDisconnect: (callback: (reason: string) => void) => socketManager.onDisconnect(callback),
  onError: (callback: (error: Error) => void) => socketManager.onError(callback),
  isConnected: () => socketManager.isConnected(),
  getCurrentContainer: () => socketManager.getCurrentContainer(),
  connectToSystemLogs: () => socketManager.connectToSystemLogs(),
  onSystemLog: (callback: (data: LogMessage) => void) => socketManager.onSystemLog(callback),
  offSystemLog: () => socketManager.offSystemLog(),
};

export default socketService; 