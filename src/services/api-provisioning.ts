/**
 * API Provisioning
 *
 * This file is a re-export from the api-provisioning/ directory.
 * The module has been refactored into smaller focused modules.
 */
export {
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
  serverUpdateApi,
  regenerateStartScripts,
  getStartScript,
  provisioningApi,
} from './api-provisioning/provisioning-core';
  },

  /**
   * Backup cluster with options
   */
  backupCluster: async (
    clusterName: string,
    options?: {
      destination?: string;
      saves?: boolean;
      configs?: boolean;
      logs?: boolean;
    },
  ): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }> => {
    const response = await api.post(
      `/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`,
      options || {},
    );
    return response.data;
  },

  /**
   * Restore cluster with options
   */
  restoreCluster: async (
    clusterName: string,
    options?: {
      source?: string;
      saves?: boolean;
      configs?: boolean;
      logs?: boolean;
    },
  ): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }> => {
    const response = await api.post(
      `/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`,
      options || {},
    );
    return response.data;
  },

  /**
   * Add a new server to an existing cluster.
   * Server config should include: name, map, gamePort, queryPort, rconPort, maxPlayers, etc.
   */
  addServerToCluster: async (
    clusterName: string,
    serverConfig: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; jobId?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Server added to cluster ${clusterName} successfully (mock)`,
            jobId: "mock-job-id",
          });
        }, 1000);
      });
    }

    const response = await api.post(
      `/api/provisioning/clusters/${encodeURIComponent(clusterName)}/servers`,
      serverConfig,
    );
    return response.data;
  },

  // Re-export existing provisioning functions for convenience
  initializeSystem,
  installSteamCmd,
  createServer,
  getServers,
  getClusters,
  deleteServer,
  backupServer,
  restoreServer,
  listServerBackups,
  updateAllServers,
  regenerateStartScripts,
  getStartScript,
};
