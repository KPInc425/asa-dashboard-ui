/**
 * Socket Service
 *
 * This file is a re-export from the socket/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { socketManager, default } from './socket/index';
import type { LogMessage, JobProgress, SocketEvents } from './socket/types';
export type { LogMessage, JobProgress, SocketEvents } from './socket/types';

// Re-create socketService convenience object for backward compatibility
import socketManagerInstance from './socket/index';

export const socketService = {
    connect: (containerName: string, logFile?: string) =>
        socketManagerInstance.connect(containerName, logFile),
    disconnect: () => socketManagerInstance.disconnect(),
    switchLogFile: (logFile: string) => socketManagerInstance.switchLogFile(logFile),
    onJobProgress: (callback: (data: JobProgress) => void) =>
        socketManagerInstance.onJobProgress(callback),
    offJobProgress: () => socketManagerInstance.offJobProgress(),
    onConnect: (callback: () => void) => socketManagerInstance.onConnect(callback),
    onDisconnect: (callback: (reason: string) => void) =>
        socketManagerInstance.onDisconnect(callback),
    onError: (callback: (error: Error) => void) =>
        socketManagerInstance.onError(callback),
    isConnected: () => socketManagerInstance.isConnected(),
    onSystemLog: (callback: (data: LogMessage) => void) =>
        socketManagerInstance.onSystemLog(callback),
    offSystemLog: () => socketManagerInstance.offSystemLog?.() ?? (() => {}),
    emit: (event: string, ...args: any[]) => socketManagerInstance.emit(event, ...args),
    onCustomEvent: (event: string, callback: (...args: any[]) => void) =>
        socketManagerInstance.onCustomEvent(event, callback),
    offCustomEvent: (event: string, callback?: (...args: any[]) => void) =>
        socketManagerInstance.offCustomEvent(event, callback),
};

export function setSocketBaseUrl(url: string): void {
    socketManagerInstance.setBaseUrl(url);
}
