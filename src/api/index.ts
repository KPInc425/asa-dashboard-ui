/**
 * API Module Exports
 * 
 * Central export point for all API-related functionality.
 */

// Client
export { apiClient, ApiError, resetApiClient, setApiBaseUrl, getApiBaseUrl, checkApiHealth } from './apiClient';

// Server API
export {
  serverApi,
  fetchServers,
  fetchNativeServers,
  fetchContainers,
  fetchServerDetails,
  fetchServerLiveData,
  isServerRunning,
  startServer,
  stopServer,
  restartServer,
  safeStopServer,
  safeRestartServer,
  sendRconCommand,
  saveWorld,
} from './serverApi';

// Types re-export
export type { ServerSummary, ServerLiveData, ServerActionResult } from './serverApi';
