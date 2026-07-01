/**
 * Socket Service
 *
 * This file is a re-export from the socket/ directory.
 * The module has been refactored into smaller focused modules.
 */
export { socketManager, default } from './socket/index';
export type { LogMessage, JobProgress, SocketEvents } from './socket/types';
