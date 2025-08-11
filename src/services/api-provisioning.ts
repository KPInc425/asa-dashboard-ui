import { api, FRONTEND_ONLY_MODE, ApiError } from './api-core';
import type { ClusterBackup } from './api-core';

// Provisioning API
export const initializeSystem = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/api/provisioning/initialize');
  if (!response.data.success) {
    throw new ApiError('Failed to initialize system', 500, response.data);
  }
  return response.data;
};

export const installSteamCmd = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/api/provisioning/install-steamcmd');
  if (!response.data.success) {
    throw new ApiError('Failed to install SteamCMD', 500, response.data);
  }
  return response.data;
};

export const createServer = async (serverConfig: Record<string, unknown>): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/api/provisioning/create-server', serverConfig);
  if (!response.data.success) {
    throw new ApiError('Failed to create server', 500, response.data);
  }
  return response.data;
};

export const createCluster = async (clusterConfig: Record<string, unknown>): Promise<{ success: boolean; message: string }> => {
  // Patch: Map clusterName to name for backend compatibility
  const payload = {
    ...clusterConfig,
    name: clusterConfig.clusterName,
  };
  const response = await api.post<{ success: boolean; message: string }>('/api/provisioning/clusters', payload);
  if (!response.data.success) {
    throw new ApiError('Failed to create cluster', 500, response.data);
  }
  return response.data;
};

export const getServers = async (): Promise<Array<Record<string, unknown>>> => {
  const response = await api.get<{ success: boolean; servers: Array<Record<string, unknown>> }>('/api/provisioning/servers');
  if (!response.data.success) {
    throw new ApiError('Failed to get servers', 500, response.data);
  }
  return response.data.servers;
};

export const getClusters = async (): Promise<Array<Record<string, unknown>>> => {
  const response = await api.get<{ success: boolean; clusters: Array<Record<string, unknown>> }>('/api/provisioning/clusters');
  if (!response.data.success) {
    throw new ApiError('Failed to get clusters', 500, response.data);
  }
  return response.data.clusters;
};

export const deleteServer = async (serverName: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/api/provisioning/servers/${encodeURIComponent(serverName)}`);
  if (!response.data.success) {
    throw new ApiError('Failed to delete server', 500, response.data);
  }
  return response.data;
};

export const deleteCluster = async (clusterName: string, options?: { backupSaved?: boolean; deleteFiles?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const params = new URLSearchParams();
  if (options?.backupSaved !== undefined) params.append('backupSaved', options.backupSaved.toString());
  if (options?.deleteFiles !== undefined) params.append('deleteFiles', options.deleteFiles.toString());
  
  const url = `/api/provisioning/clusters/${encodeURIComponent(clusterName)}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.delete<{ success: boolean; message: string; data?: Record<string, unknown> }>(url);
  if (!response.data.success) {
    throw new ApiError('Failed to delete cluster', 500, response.data);
  }
  return response.data;
};

export const backupCluster = async (clusterName: string, destination?: string): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const response = await api.post<{ success: boolean; message: string; data?: Record<string, unknown> }>(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`, {
    destination
  });
  if (!response.data.success) {
    throw new ApiError('Failed to backup cluster', 500, response.data);
  }
  return response.data;
};

export const restoreCluster = async (clusterName: string, source: string): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const response = await api.post<{ success: boolean; message: string; data?: Record<string, unknown> }>(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`, {
    source
  });
  if (!response.data.success) {
    throw new ApiError('Failed to restore cluster', 500, response.data);
  }
  return response.data;
};

export const backupServer = async (serverName: string, options?: { destination?: string; includeConfigs?: boolean; includeScripts?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const response = await api.post<{ success: boolean; message: string; data?: Record<string, unknown> }>(`/api/provisioning/servers/${encodeURIComponent(serverName)}/backup`, options || {});
  if (!response.data.success) {
    throw new ApiError('Failed to backup server', 500, response.data);
  }
  return response.data;
};

export const restoreServer = async (serverName: string, source: string, options?: { targetClusterName?: string; overwrite?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const response = await api.post<{ success: boolean; message: string; data?: Record<string, unknown> }>(`/api/provisioning/servers/${encodeURIComponent(serverName)}/restore`, {
    source,
    ...options
  });
  if (!response.data.success) {
    throw new ApiError('Failed to restore server', 500, response.data);
  }
  return response.data;
};

export const listServerBackups = async (): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const response = await api.get<{ success: boolean; message: string; data?: Record<string, unknown> }>('/api/provisioning/server-backups');
  if (!response.data.success) {
    throw new ApiError('Failed to list server backups', 500, response.data);
  }
  return response.data;
};

export const updateAllServers = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/api/provisioning/update-all-servers');
  if (!response.data.success) {
    throw new ApiError('Failed to update all servers', 500, response.data);
  }
  return response.data;
};

// Server Update Management API
export const serverUpdateApi = {
  /**
   * Get update configuration for a server
   */
  getServerUpdateConfig: async (serverName: string): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        data: {
          serverName,
          clusterName: 'TestCluster',
          updateOnStart: true,
          lastUpdate: new Date().toISOString(),
          updateEnabled: true,
          autoUpdate: false,
          updateInterval: 24,
          updateSchedule: null
        }
      };
    }
    const response = await api.get(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-config`);
    return response.data;
  },

  /**
   * Update server update configuration
   */
  updateServerUpdateConfig: async (serverName: string, config: Record<string, unknown>): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: 'Update configuration updated successfully' };
    }
    const response = await api.put(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-config`, config);
    return response.data;
  },

  /**
   * Check server update status
   */
  checkServerUpdateStatus: async (serverName: string): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        data: {
          needsUpdate: false,
          reason: 'No update needed',
          lastUpdate: new Date().toISOString(),
          updateEnabled: true
        }
      };
    }
    const response = await api.get(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-status`);
    return response.data;
  },

  /**
   * Update server with configuration
   */
  updateServerWithConfig: async (serverName: string, options: { force?: boolean; updateConfig?: boolean; background?: boolean }): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: `Server ${serverName} updated successfully` };
    }
    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-with-config`, options);
    return response.data;
  },

  /**
   * Update server settings
   */
  updateServerSettings: async (serverName: string, settings: Record<string, unknown>, options: { regenerateConfigs?: boolean; regenerateScripts?: boolean } = {}): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: `Server ${serverName} settings updated successfully` };
    }
    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-settings`, {
      settings,
      ...options
    });
    return response.data;
  },

  /**
   * Update all servers with configuration
   */
  updateAllServersWithConfig: async (options: { force?: boolean; updateConfig?: boolean; skipDisabled?: boolean }): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: 'Update process completed. Updated: 3, Skipped: 0, Failed: 0' };
    }
    const response = await api.post('/api/provisioning/update-all-servers-with-config', options);
    return response.data;
  },

  /**
   * Get update status for all servers
   */
  getUpdateStatusAll: async (): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        data: [
          {
            serverName: 'TestServer1',
            clusterName: 'TestCluster',
            status: {
              needsUpdate: false,
              reason: 'No update needed',
              lastUpdate: new Date().toISOString(),
              updateEnabled: true
            },
            config: {
              serverName: 'TestServer1',
              clusterName: 'TestCluster',
              updateOnStart: true,
              lastUpdate: new Date().toISOString(),
              updateEnabled: true,
              autoUpdate: false,
              updateInterval: 24,
              updateSchedule: null
            }
          }
        ]
      };
    }
    const response = await api.get('/api/provisioning/update-status-all');
    return response.data;
  }
};

export const regenerateStartScripts = async (): Promise<{ 
  success: boolean; 
  message: string; 
  details?: {
    successful: Array<Record<string, unknown>>;
    failed: Array<Record<string, unknown>>;
    totalProcessed: number;
  };
}> => {
  const response = await api.post('/api/provisioning/regenerate-start-scripts');
  return response.data;
};

export const getStartScript = async (serverName: string): Promise<{
  success: boolean;
  serverName: string;
  clusterName: string;
  scriptPath: string;
  content: string;
  lastModified: string;
}> => {
  const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/start-bat`);
  return response.data;
};

// Provisioning API object for system logs and other provisioning functions
export const provisioningApi = {
  /**
   * Get system information for provisioning
   */
  getSystemInfo: async (): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            systemInfo: {
              diskSpace: { total: 1000000000000, free: 500000000000, used: 500000000000, usagePercent: 50, drive: 'G' },
              memory: { total: 16000000000, free: 8000000000, used: 8000000000 },
              steamCmdInstalled: true,
              steamCmdPath: 'C:\\SteamCMD\\steamcmd.exe',
              asaBinariesInstalled: true,
              basePath: 'G:\\ARK'
            }
          });
        }, 500);
      });
    }

    const response = await api.get('/api/provisioning/system-info');
    const data = response.data;
    
    // Transform the response to match expected structure
    if (data.success && data.status) {
      return {
        success: true,
        status: {
          diskSpace: { 
            total: data.status.diskSpace?.total || 0,
            free: data.status.diskSpace?.free || 0,
            used: data.status.diskSpace?.used || 0,
            usagePercent: data.status.diskSpace?.usagePercent || 0,
            drive: data.status.diskSpace?.drive
          },
          memory: { 
            total: data.status.memory?.total || 0,
            free: data.status.memory?.free || 0,
            used: data.status.memory?.used || 0,
            usagePercent: data.status.memory?.usagePercent || 0
          },
          steamCmdInstalled: data.status.steamCmdInstalled || false,
          steamCmdPath: data.status.steamCmdPath,
          asaBinariesInstalled: data.status.asaBinariesInstalled || false,
          basePath: data.status.basePath || 'C:\\ARK',
          platform: data.status.platform,
          arch: data.status.arch,
          nodeVersion: data.status.nodeVersion,
          cpuCores: data.status.cpuCores
        }
      };
    }
    return data;
  },

  /**
   * Get system requirements (alias for getSystemInfo)
   */
  getRequirements: async (): Promise<Record<string, unknown>> => {
    return provisioningApi.getSystemInfo();
  },

  /**
   * Initialize provisioning system
   */
  initialize: async (): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'System initialized successfully (mock)'
          });
        }, 2000);
      });
    }

    const response = await api.post('/api/provisioning/initialize');
    return response.data;
  },

  /**
   * Find existing SteamCMD
   */
  findSteamCmd: async (): Promise<{ success: boolean; steamCmdPath?: string; found: boolean }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            steamCmdPath: 'C:\\SteamCMD\\steamcmd.exe',
            found: true
          });
        }, 1000);
      });
    }

    const response = await api.post('/api/provisioning/find-steamcmd');
    return response.data;
  },

  /**
   * Configure SteamCMD
   */
  configureSteamCmd: async (config: { customPath?: string; autoInstall?: boolean }): Promise<{ success: boolean; message: string; steamCmdPath: string; autoInstall: boolean }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'SteamCMD configured successfully (mock)',
            steamCmdPath: config.customPath || 'C:\\SteamCMD\\steamcmd.exe',
            autoInstall: config.autoInstall || false
          });
        }, 1000);
      });
    }

    const response = await api.post('/api/provisioning/configure-steamcmd', config);
    return response.data;
  },

  /**
   * Install ASA binaries
   */
  installASABinaries: async (foreground: boolean = false): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'ASA binaries installed successfully (mock)'
          });
        }, 5000);
      });
    }

    const response = await api.post('/api/provisioning/install-asa-binaries', { foreground });
    return response.data;
  },

  /**
   * Get shared mods configuration
   */
  getSharedMods: async (): Promise<{ success: boolean; sharedMods: number[] }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            sharedMods: [928102085, 1404697612]
          });
        }, 500);
      });
    }

    const response = await api.get('/api/provisioning/shared-mods');
    return response.data;
  },

  /**
   * Update shared mods configuration
   */
  updateSharedMods: async (modList: number[]): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Shared mods updated successfully (mock)'
          });
        }, 1000);
      });
    }

    const response = await api.put('/api/provisioning/shared-mods', { modList });
    return response.data;
  },

  /**
   * Get server-specific mods configuration
   */
  getServerMods: async (serverName: string): Promise<{ success: boolean; serverConfig: { additionalMods: number[]; excludeSharedMods: boolean } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            serverConfig: {
              additionalMods: [1609138312, 215527665],
              excludeSharedMods: false
            }
          });
        }, 500);
      });
    }

    const response = await api.get(`/api/provisioning/server-mods/${serverName}`);
    return response.data;
  },

  /**
   * Update server-specific mods configuration
   */
  updateServerMods: async (serverName: string, config: { additionalMods: number[]; excludeSharedMods: boolean }): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Server mods for ${serverName} updated successfully (mock)`
          });
        }, 1000);
      });
    }

    const response = await api.put(`/api/provisioning/server-mods/${serverName}`, config);
    return response.data;
  },

  /**
   * Get global config files
   */
  getGlobalConfigs: async (): Promise<{ success: boolean; gameIni: string; gameUserSettingsIni: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            gameIni: '[ServerSettings]\nMaxPlayers=70\n\n[GameRules]\nAllowCaveBuildingPvE=true',
            gameUserSettingsIni: '[/script/shootergame.shootergamemode]\nMatingIntervalMultiplier=1.0\nEggHatchSpeedMultiplier=1.0'
          });
        }, 500);
      });
    }

    const response = await api.get('/api/provisioning/global-configs');
    return response.data;
  },

  /**
   * Update global config files
   */
  updateGlobalConfigs: async (configs: { gameIni?: string; gameUserSettingsIni?: string }): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Global configs updated successfully (mock)'
          });
        }, 1000);
      });
    }

    const response = await api.put('/api/provisioning/global-configs', configs);
    return response.data;
  },

  /**
   * Get config exclusions
   */
  getConfigExclusions: async (): Promise<{ success: boolean; excludedServers: string[] }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            excludedServers: ['Club ARK Server', 'Test Server']
          });
        }, 500);
      });
    }

    const response = await api.get('/api/provisioning/config-exclusions');
    return response.data;
  },

  /**
   * Update config exclusions
   */
  updateConfigExclusions: async (excludedServers: string[]): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Config exclusions updated successfully (mock)'
          });
        }, 1000);
      });
    }

    const response = await api.put('/api/provisioning/config-exclusions', { excludedServers });
    return response.data;
  },

  /**
   * Get mods overview
   */
  getModsOverview: async (): Promise<{ success: boolean; overview: { sharedMods: number[]; serverMods: Record<string, Record<string, unknown>>; totalServers: number } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            overview: {
              sharedMods: [928102085, 1404697612, 1565015734],
              serverMods: {
                'MyServer1': { additionalMods: [1609138312], excludeSharedMods: false },
                'MyServer2': { additionalMods: [215527665], excludeSharedMods: true }
              },
              totalServers: 2
            }
          });
        }, 500);
      });
    }

    const response = await api.get('/api/provisioning/mods-overview');
    return response.data;
  },

  /**
   * Get system logs
   */
  getSystemLogs: async (type: string = 'all', lines: number = 100): Promise<{
    success: boolean;
    serviceInfo?: Record<string, unknown>;
    logFiles?: Record<string, unknown>;
    type?: string;
    lines?: number;
    totalLogFiles?: number;
    message?: string;
  }> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        serviceInfo: {
          mode: 'native',
          isWindowsService: false,
          serviceInstallPath: null,
          logBasePath: '/app',
          currentWorkingDirectory: '/app',
          processId: 12345,
          parentProcessId: 1234
        },
        logFiles: {
          combined: {
            content: `[${new Date().toISOString()}] INFO: Frontend-only mode - no real logs available\n[${new Date().toISOString()}] INFO: This is a mock log file for testing\n[${new Date().toISOString()}] WARN: System logs endpoint not available in frontend-only mode`,
            path: '/mock/combined.log',
            exists: true
          },
          error: {
            content: `[${new Date().toISOString()}] ERROR: Mock error log for testing\n[${new Date().toISOString()}] WARN: This is not a real error log`,
            path: '/mock/error.log',
            exists: true
          },
          nodeOut: {
            content: `[${new Date().toISOString()}] INFO: Mock node stdout log\n[${new Date().toISOString()}] INFO: Node.js process started`,
            path: '/mock/node-out.log',
            exists: true
          },
          nodeErr: {
            content: `[${new Date().toISOString()}] ERROR: Mock node stderr log\n[${new Date().toISOString()}] WARN: Mock warning message`,
            path: '/mock/node-err.log',
            exists: true
          }
        },
        type,
        lines,
        totalLogFiles: 4
      };
    }
    
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (lines) params.append('lines', lines.toString());
    
    const response = await api.get(`/api/provisioning/system-logs?${params.toString()}`);
    return response.data;
  },

  /**
   * List clusters
   */
  listClusters: async (): Promise<{ success: boolean; clusters: Array<Record<string, unknown>> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            clusters: [
              {
                name: 'TestCluster',
                description: 'A test cluster',
                basePort: 7777,
                serverCount: 2,
                created: new Date().toISOString(),
                servers: [
                  { name: 'TestCluster-Server1', gamePort: 7777 },
                  { name: 'TestCluster-Server2', gamePort: 7778 }
                ]
              }
            ]
          });
        }, 500);
      });
    }

    console.log('Making API call to /api/provisioning/clusters');
    const response = await api.get('/api/provisioning/clusters');
    console.log('API response:', response);
    console.log('API response.data:', response.data);
    console.log('API response.data.clusters:', response.data.clusters);
    console.log('API response.data.clusters[0]:', response.data.clusters?.[0]);
    return response.data;
  },

  /**
   * Get cluster details
   */
  getClusterDetails: async (clusterName: string): Promise<{ success: boolean; cluster: Record<string, unknown> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            cluster: {
              name: clusterName,
              description: 'A test cluster',
              basePort: 7777,
              serverCount: 2,
              created: new Date().toISOString(),
              servers: [
                { name: `${clusterName}-Server1`, gamePort: 7777, status: 'running' },
                { name: `${clusterName}-Server2`, gamePort: 7778, status: 'stopped' }
              ]
            }
          });
        }, 500);
      });
    }

    console.log(`Making API call to /api/provisioning/clusters/${clusterName}`);
    const response = await api.get(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}`);
    console.log('API response:', response);
    return response.data;
  },

  /**
   * Start cluster
   */
  startCluster: async (clusterName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Cluster ${clusterName} started successfully (mock)`
          });
        }, 2000);
      });
    }

    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/start`);
    return response.data;
  },

  /**
   * Stop cluster
   */
  stopCluster: async (clusterName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Cluster ${clusterName} stopped successfully (mock)`
          });
        }, 2000);
      });
    }

    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/stop`);
    return response.data;
  },

  /**
   * Restart cluster
   */
  restartCluster: async (clusterName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Cluster ${clusterName} restarted successfully (mock)`
          });
        }, 3000);
      });
    }

    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restart`);
    return response.data;
  },

  /**
   * Create cluster
   */
  createCluster: async (clusterConfig: Record<string, unknown>): Promise<{ success: boolean; cluster?: Record<string, unknown>; message: string; jobId?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            cluster: clusterConfig,
            message: 'Cluster created successfully (mock)',
            jobId: 'mock-job-id'
          });
        }, 1000);
      });
    }

    const response = await api.post('/api/provisioning/clusters', clusterConfig);
    return response.data;
  },

  /**
   * Get job status
   */
  getJobStatus: async (jobId: string): Promise<{ success: boolean; job?: Record<string, unknown>; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            job: {
              id: jobId,
              status: 'completed',
              progress: 100,
              message: 'Job completed successfully (mock)'
            },
            message: 'Job status retrieved successfully (mock)'
          });
        }, 500);
      });
    }

    const response = await api.get(`/api/provisioning/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Delete cluster
   */
  deleteCluster: async (name: string, options?: { backupSaved?: boolean; deleteFiles?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Cluster ${name} deleted successfully (mock)`,
            data: { backupPath: '/mock/backup/path' }
          });
        }, 1000);
      });
    }

    const params = new URLSearchParams();
    if (options?.backupSaved !== undefined) params.append('backupSaved', options.backupSaved.toString());
    if (options?.deleteFiles !== undefined) params.append('deleteFiles', options.deleteFiles.toString());
    
    const url = `/api/provisioning/clusters/${encodeURIComponent(name)}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.delete(url);
    return response.data;
  },

  /**
   * Export cluster config (download as JSON)
   */
  exportClusterConfig: async (clusterName: string): Promise<Blob> => {
    const response = await api.get(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/export`, { responseType: 'blob' });
    return response.data;
  },

  /**
   * Import cluster config (upload JSON)
   */
  importClusterConfig: async (file: File): Promise<{ success: boolean; message?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/provisioning/clusters/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Download cluster backup (as ZIP)
   */
  downloadClusterBackup: async (clusterName: string, backupName: string): Promise<Blob> => {
    const response = await api.get(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/download-backup?backup=${encodeURIComponent(backupName)}`, { responseType: 'blob' });
    return response.data;
  },

  /**
   * Download server backup (as ZIP)
   */
  downloadServerBackup: async (serverName: string, backupName: string): Promise<Blob> => {
    const response = await api.get(`/api/provisioning/servers/${encodeURIComponent(serverName)}/download-backup?backup=${encodeURIComponent(backupName)}`, { responseType: 'blob' });
    return response.data;
  },

  /**
   * Delete server backup
   */
  deleteServerBackup: async (serverName: string, backupName: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/provisioning/servers/${encodeURIComponent(serverName)}/backups/${encodeURIComponent(backupName)}`);
    return response.data;
  },

  /**
   * Restore cluster backup (alias for restoreCluster)
   */
  restoreClusterBackup: async (file: File, clusterName: string): Promise<{ success: boolean; message?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clusterName', clusterName);
    const response = await api.post(`/api/provisioning/cluster-backups/${encodeURIComponent(clusterName)}/restore`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Restore server backup (alias for restoreServer)
   */
  restoreServerBackup: async (file: File, serverName: string): Promise<{ success: boolean; message?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('serverName', serverName);
    const response = await api.post(`/api/provisioning/server-backups/${encodeURIComponent(serverName)}/restore`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Get cluster backups
   */
  getClusterBackups: async (clusterName: string): Promise<{ success: boolean; backups: ClusterBackup[]; count: number; message?: string }> => {
    const response = await api.get<{ success: boolean; data: ClusterBackup[]; message?: string }>(`/api/provisioning/cluster-backups/${encodeURIComponent(clusterName)}`);
    if (!response.data.success) {
      throw new ApiError('Failed to get cluster backups', 500, response.data);
    }
    return { success: true, backups: response.data.data, count: response.data.data?.length || 0, message: response.data.message };
  },

  /**
   * List cluster backups (alias for getClusterBackups)
   */
  listClusterBackups: async (clusterName: string) => {
    return provisioningApi.getClusterBackups(clusterName);
  },

  /**
   * Backup cluster with options
   */
  backupCluster: async (clusterName: string, options?: { destination?: string; saves?: boolean; configs?: boolean; logs?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`, options || {});
    return response.data;
  },

  /**
   * Restore cluster with options
   */
  restoreCluster: async (clusterName: string, options?: { source?: string; saves?: boolean; configs?: boolean; logs?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`, options || {});
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
  getStartScript
};
