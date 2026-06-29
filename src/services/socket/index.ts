/**
 * Socket Service — Re-exports
 *
 * Split from the original socket.ts (603 lines) into focused modules.
 */
export { socketManager, default } from './socket-manager';
export type { LogMessage, JobProgress, SocketEvents } from './types';
