/**
 * ARK Dashboard API Service - Main Entry Point
 * 
 * This file serves as the main entry point for all API services.
 * It imports from modular API files and provides a unified interface.
 * 
 * FRONTEND-ONLY MODE:
 * Set VITE_FRONTEND_ONLY=true in .env for testing without backend
 * Set VITE_FRONTEND_ONLY=false or remove from .env to use real backend API
 * 
 * Test credentials: admin / admin123
 */

// Import core API setup and types
export * from './api-core';

// Import all API modules
import { containerApi } from './api-containers';
import { configApi, getArkConfigFile, updateArkConfigFile, getServerConfigInfo } from './api-config';
import { authApi } from './api-auth';
import { logsApi } from './api-logs';
import { environmentApi } from './api-environment';
import { 
  provisioningApi, 
  serverUpdateApi,
  initializeSystem,
  installSteamCmd,
  createServer,
  createCluster,
  getServers,
  getClusters,
  deleteServer,
  deleteCluster,
  backupCluster,
  restoreCluster,
  backupServer,
  restoreServer,
  listServerBackups,
  updateAllServers,
  regenerateStartScripts,
  getStartScript
} from './api-provisioning';
import { lockApi } from './api-lock';

// Re-export all API modules
export { containerApi } from './api-containers';
export { configApi, getArkConfigFile, updateArkConfigFile, getServerConfigInfo } from './api-config';
export { authApi } from './api-auth';
export { logsApi } from './api-logs';
export { environmentApi } from './api-environment';
export { 
  provisioningApi, 
  serverUpdateApi,
  initializeSystem,
  installSteamCmd,
  createServer,
  createCluster,
  getServers,
  getClusters,
  deleteServer,
  deleteCluster,
  backupCluster,
  restoreCluster,
  backupServer,
  restoreServer,
  listServerBackups,
  updateAllServers,
  regenerateStartScripts,
  getStartScript
} from './api-provisioning';
export { lockApi } from './api-lock';

// Export all APIs as a single object for convenience
export const apiService = {
  containers: containerApi,
  config: configApi,
  lock: lockApi,
  auth: authApi,
  logs: logsApi,
  environment: environmentApi,
  provisioning: provisioningApi,
};

// Re-export the API instance for direct access
export { api } from './api-core';

export default apiService; 