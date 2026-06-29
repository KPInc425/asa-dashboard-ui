/**
 * Socket Service
 *
 * This file is a re-export from the socket/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { socketManager, default } from './socket/index';
export type { LogMessage, JobProgress, SocketEvents } from './socket/types';

    /**
     * Unsubscribe from system log events
     */
    offSystemLog(): void {
        if (this.socket) {
            this.socket.off("system-log-data");
        }
    }

    /**
     * Emit a custom event to the server
     */
    emit(event: string, ...args: any[]): void {
        if (this.socket) {
            this.socket.emit(event, ...args);
        }
    }
}

// Create singleton instance
export const socketManager = new SocketManager();

/**
 * Set the socket base URL at runtime (called when environment switches).
 * This ensures Socket.IO connections are pointed at the correct backend.
 */
export function setSocketBaseUrl(url: string): void {
    socketManager.setBaseUrl(url);
}

// Export convenience functions
export const socketService = {
    connect: (containerName: string, logFile?: string) =>
        socketManager.connect(containerName, logFile),
    disconnect: () => socketManager.disconnect(),
    switchLogFile: (logFile: string) => socketManager.switchLogFile(logFile),
    switchToContainerLogs: () => socketManager.switchToContainerLogs(),
    switchToServerLogs: (serverName: string) =>
        socketManager.switchToServerLogs(serverName),
    onContainerLog: (callback: (data: LogMessage) => void) =>
        socketManager.onContainerLog(callback),
    onArkLog: (callback: (data: LogMessage) => void) =>
        socketManager.onArkLog(callback),
    onServerLog: (callback: (data: LogMessage) => void) =>
        socketManager.onServerLog(callback),
    onJobProgress: (callback: (data: JobProgress) => void) =>
        socketManager.onJobProgress(callback),
    offContainerLog: () => socketManager.offContainerLog(),
    offArkLog: () => socketManager.offArkLog(),
    offServerLog: () => socketManager.offServerLog(),
    offJobProgress: () => socketManager.offJobProgress(),
    onConnect: (callback: () => void) => socketManager.onConnect(callback),
    onDisconnect: (callback: (reason: string) => void) =>
        socketManager.onDisconnect(callback),
    onError: (callback: (error: Error) => void) =>
        socketManager.onError(callback),
    isConnected: () => socketManager.isConnected(),
    getCurrentContainer: () => socketManager.getCurrentContainer(),
    connectToSystemLogs: () => socketManager.connectToSystemLogs(),
    onSystemLog: (callback: (data: LogMessage) => void) =>
        socketManager.onSystemLog(callback),
    offSystemLog: () => socketManager.offSystemLog(),
    // Custom event subscription for scalability
    onCustomEvent: (event: string, callback: (...args: any[]) => void) => {
        const sock = (socketManager as any).socket;
        if (sock) sock.on(event, callback);
    },
    offCustomEvent: (event: string, callback: (...args: any[]) => void) => {
        const sock = (socketManager as any).socket;
        if (sock) sock.off(event, callback);
    },
    // Emit custom events to the server
    emit: (event: string, ...args: any[]) => socketManager.emit(event, ...args),
};

export default socketService;
