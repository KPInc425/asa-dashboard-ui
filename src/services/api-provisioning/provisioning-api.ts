import { api, FRONTEND_ONLY_MODE, ApiError } from "../api-core";
import type { ClusterBackup } from "../api-core";
import { isDemoMode } from "../../demo/demo-core";

function useMockData(): boolean {
  return FRONTEND_ONLY_MODE || isDemoMode();
}

export const provisioningApi = {
  getSystemInfo: async (): Promise<Record<string, unknown>> => {
    if (useMockData()) {
      if (isDemoMode()) {
        const { getDemoSystemInfo } = await import("../../demo/demo-data");
        return getDemoSystemInfo();
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            systemInfo: {
              diskSpace: { total: 1000000000000, free: 500000000000, used: 500000000000, usagePercent: 50, drive: "G" },
              memory: { total: 16000000000, free: 8000000000, used: 8000000000 },
              steamCmdInstalled: true,
              steamCmdPath: "C:\\SteamCMD\\steamcmd.exe",
              asaBinariesInstalled: true,
              basePath: "G:\\ARK",
            },
          });
        }, 500);
      });
    }
    const response = await api.get("/api/provisioning/system-info");
    const data = response.data;
    if (data.success && data.status) {
      return {
        success: true,
        status: {
          diskSpace: { total: data.status.diskSpace?.total || 0, free: data.status.diskSpace?.free || 0, used: data.status.diskSpace?.used || 0, usagePercent: data.status.diskSpace?.usagePercent || 0, drive: data.status.diskSpace?.drive },
          memory: { total: data.status.memory?.total || 0, free: data.status.memory?.free || 0, used: data.status.memory?.used || 0, usagePercent: data.status.memory?.usagePercent || 0 },
          steamCmdInstalled: data.status.steamCmdInstalled || false,
          steamCmdPath: data.status.steamCmdPath,
          asaBinariesInstalled: data.status.asaBinariesInstalled || false,
          basePath: data.status.basePath || "C:\\ARK",
          platform: data.status.platform,
          arch: data.status.arch,
          nodeVersion: data.status.nodeVersion,
          cpuCores: data.status.cpuCores,
        },
      };
    }
    return data;
  },

  getRequirements: async (): Promise<Record<string, unknown>> => {
    return provisioningApi.getSystemInfo();
  },

  initialize: async (): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "System initialized successfully (mock)" }), 2000);
      });
    }
    const response = await api.post("/api/provisioning/initialize");
    return response.data;
  },

  findSteamCmd: async (): Promise<{ success: boolean; steamCmdPath?: string; found: boolean }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, steamCmdPath: "C:\\SteamCMD\\steamcmd.exe", found: true }), 1000);
      });
    }
    const response = await api.post("/api/provisioning/find-steamcmd");
    return response.data;
  },

  configureSteamCmd: async (config: { customPath?: string; autoInstall?: boolean }): Promise<{ success: boolean; message: string; steamCmdPath: string; autoInstall: boolean }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "SteamCMD configured successfully (mock)", steamCmdPath: config.customPath || "C:\\SteamCMD\\steamcmd.exe", autoInstall: config.autoInstall || false }), 1000);
      });
    }
    const response = await api.post("/api/provisioning/configure-steamcmd", config);
    return response.data;
  },

  installASABinaries: async (foreground: boolean = false): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "ASA binaries installed successfully (mock)" }), 5000);
      });
    }
    const response = await api.post("/api/provisioning/install-asa-binaries", { foreground });
    return response.data;
  },

  getSharedMods: async (): Promise<{ success: boolean; sharedMods: number[] }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, sharedMods: [928102085, 1404697612] }), 500);
      });
    }
    const response = await api.get("/api/provisioning/shared-mods");
    return response.data;
  },

  updateSharedMods: async (modList: number[]): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "Shared mods updated successfully (mock)" }), 1000);
      });
    }
    const response = await api.put("/api/provisioning/shared-mods", { modList });
    return response.data;
  },

  getServerMods: async (serverName: string): Promise<{ success: boolean; serverConfig: { additionalMods: number[]; excludeSharedMods: boolean } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, serverConfig: { additionalMods: [1609138312, 215527665], excludeSharedMods: false } }), 500);
      });
    }
    const response = await api.get(`/api/provisioning/server-mods/${serverName}`);
    return response.data;
  },

  updateServerMods: async (serverName: string, config: { additionalMods: number[]; excludeSharedMods: boolean }): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Server mods for ${serverName} updated successfully (mock)` }), 1000);
      });
    }
    const response = await api.put(`/api/provisioning/server-mods/${serverName}`, config);
    return response.data;
  },

  getGlobalConfigs: async (): Promise<{ success: boolean; gameIni: string; gameUserSettingsIni: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, gameIni: "[ServerSettings]\nMaxPlayers=70\n\n[GameRules]\nAllowCaveBuildingPvE=true", gameUserSettingsIni: "[/script/shootergame.shootergamemode]\nMatingIntervalMultiplier=1.0\nEggHatchSpeedMultiplier=1.0" }), 500);
      });
    }
    const response = await api.get("/api/provisioning/global-configs");
    return response.data;
  },

  updateGlobalConfigs: async (configs: { gameIni?: string; gameUserSettingsIni?: string }): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "Global configs updated successfully (mock)" }), 1000);
      });
    }
    const response = await api.put("/api/provisioning/global-configs", configs);
    return response.data;
  },

  getConfigExclusions: async (): Promise<{ success: boolean; excludedServers: string[] }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, excludedServers: ["Club ARK Server", "Test Server"] }), 500);
      });
    }
    const response = await api.get("/api/provisioning/config-exclusions");
    return response.data;
  },

  updateConfigExclusions: async (excludedServers: string[]): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "Config exclusions updated successfully (mock)" }), 1000);
      });
    }
    const response = await api.put("/api/provisioning/config-exclusions", { excludedServers });
    return response.data;
  },

  getModsOverview: async (): Promise<{ success: boolean; overview: { sharedMods: number[]; serverMods: Record<string, Record<string, unknown>>; totalServers: number } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, overview: { sharedMods: [928102085, 1404697612, 1565015734], serverMods: { MyServer1: { additionalMods: [1609138312], excludeSharedMods: false }, MyServer2: { additionalMods: [215527665], excludeSharedMods: true } }, totalServers: 2 } }), 500);
      });
    }
    const response = await api.get("/api/provisioning/mods-overview");
    return response.data;
  },

  getSystemLogs: async (type: string = "all", lines: number = 100): Promise<{ success: boolean; serviceInfo?: Record<string, unknown>; logFiles?: Record<string, unknown>; type?: string; lines?: number; totalLogFiles?: number; message?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        serviceInfo: { mode: "native", isWindowsService: false, serviceInstallPath: null, logBasePath: "/app", currentWorkingDirectory: "/app", processId: 12345, parentProcessId: 1234 },
        logFiles: {
          combined: { content: `[${new Date().toISOString()}] INFO: Frontend-only mode - no real logs available\n[${new Date().toISOString()}] INFO: This is a mock log file for testing\n[${new Date().toISOString()}] WARN: System logs endpoint not available in frontend-only mode`, path: "/mock/combined.log", exists: true },
          error: { content: `[${new Date().toISOString()}] ERROR: Mock error log for testing\n[${new Date().toISOString()}] WARN: This is not a real error log`, path: "/mock/error.log", exists: true },
          nodeOut: { content: `[${new Date().toISOString()}] INFO: Mock node stdout log\n[${new Date().toISOString()}] INFO: Node.js process started`, path: "/mock/node-out.log", exists: true },
          nodeErr: { content: `[${new Date().toISOString()}] ERROR: Mock node stderr log\n[${new Date().toISOString()}] WARN: Mock warning message`, path: "/mock/node-err.log", exists: true },
        },
        type, lines, totalLogFiles: 4,
      };
    }
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (lines) params.append("lines", lines.toString());
    const response = await api.get(`/api/provisioning/system-logs?${params.toString()}`);
    return response.data;
  },

  listClusters: async (): Promise<{ success: boolean; clusters: Record<string, unknown>[] }> => {
    if (useMockData()) {
      if (isDemoMode()) {
        const { getDemoClusters } = await import("../../demo/demo-data");
        return { success: true, clusters: getDemoClusters() as unknown as Record<string, unknown>[] };
      }
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, clusters: [{ name: "TestCluster", description: "A test cluster", basePort: 7777, serverCount: 2, created: new Date().toISOString(), servers: [{ name: "TestCluster-Server1", gamePort: 7777 }, { name: "TestCluster-Server2", gamePort: 7778 }] }] }), 500);
      });
    }
    const response = await api.get("/api/provisioning/clusters");
    return response.data;
  },

  getClusterDetails: async (clusterName: string): Promise<{ success: boolean; cluster: Record<string, unknown> }> => {
    if (useMockData()) {
      if (isDemoMode()) {
        const { getDemoClusters } = await import("../../demo/demo-data");
        const clusters = getDemoClusters();
        const cluster = clusters.find((c) => c.name === clusterName);
        return { success: true, cluster: (cluster || clusters[0]) as unknown as Record<string, unknown> };
      }
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, cluster: { name: clusterName, description: "A test cluster", basePort: 7777, serverCount: 2, created: new Date().toISOString(), servers: [{ name: `${clusterName}-Server1`, gamePort: 7777, status: "running" }, { name: `${clusterName}-Server2`, gamePort: 7778, status: "stopped" }] } }), 500);
      });
    }
    const response = await api.get(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}`);
    return response.data;
  },

  startCluster: async (clusterName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Cluster ${clusterName} started successfully (mock)` }), 2000);
      });
    }
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/start`);
    return response.data;
  },

  stopCluster: async (clusterName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Cluster ${clusterName} stopped successfully (mock)` }), 2000);
      });
    }
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/stop`);
    return response.data;
  },

  restartCluster: async (clusterName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Cluster ${clusterName} restarted successfully (mock)` }), 3000);
      });
    }
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restart`);
    return response.data;
  },

  createCluster: async (clusterConfig: Record<string, unknown>): Promise<{ success: boolean; cluster?: Record<string, unknown>; message: string; jobId?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, cluster: clusterConfig, message: "Cluster created successfully (mock)", jobId: "mock-job-id" }), 1000);
      });
    }
    const response = await api.post("/api/provisioning/clusters", clusterConfig);
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<{ success: boolean; job?: Record<string, unknown>; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, job: { id: jobId, status: "completed", progress: 100, message: "Job completed successfully (mock)" }, message: "Job status retrieved successfully (mock)" }), 500);
      });
    }
    const response = await api.get(`/api/provisioning/jobs/${jobId}`);
    return response.data;
  },

  deleteCluster: async (name: string, options?: { backupSaved?: boolean; deleteFiles?: boolean }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Cluster ${name} deleted successfully (mock)`, data: { backupPath: "/mock/backup/path" } }), 1000);
      });
    }
    const params = new URLSearchParams();
    if (options?.backupSaved !== undefined) params.append("backupSaved", options.backupSaved.toString());
    if (options?.deleteFiles !== undefined) params.append("deleteFiles", options.deleteFiles.toString());
    const url = `/api/provisioning/clusters/${encodeURIComponent(name)}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.delete(url);
    return response.data;
  },

  exportClusterConfig: async (clusterName: string): Promise<Blob> => {
    const response = await api.get(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/export`, { responseType: "blob" });
    return response.data;
  },

  importClusterConfig: async (file: File): Promise<{ success: boolean; message?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/provisioning/clusters/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data;
  },

  downloadClusterBackup: async (clusterName: string, backupName: string): Promise<Blob> => {
    const response = await api.get(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/download-backup?backup=${encodeURIComponent(backupName)}`, { responseType: "blob" });
    return response.data;
  },

  downloadServerBackup: async (serverName: string, backupName: string): Promise<Blob> => {
    const response = await api.get(`/api/provisioning/servers/${encodeURIComponent(serverName)}/download-backup?backup=${encodeURIComponent(backupName)}`, { responseType: "blob" });
    return response.data;
  },

  deleteServerBackup: async (serverName: string, backupName: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/provisioning/servers/${encodeURIComponent(serverName)}/backups/${encodeURIComponent(backupName)}`);
    return response.data;
  },

  restoreClusterBackup: async (file: File, clusterName: string): Promise<{ success: boolean; message?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clusterName", clusterName);
    const response = await api.post(`/api/provisioning/cluster-backups/${encodeURIComponent(clusterName)}/restore`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data;
  },

  restoreServerBackup: async (file: File, serverName: string): Promise<{ success: boolean; message?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("serverName", serverName);
    const response = await api.post(`/api/provisioning/server-backups/${encodeURIComponent(serverName)}/restore`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data;
  },

  getClusterBackups: async (clusterName: string): Promise<{ success: boolean; backups: ClusterBackup[]; count: number; message?: string }> => {
    const response = await api.get<{ success: boolean; data: ClusterBackup[]; message?: string }>(`/api/provisioning/cluster-backups/${encodeURIComponent(clusterName)}`);
    if (!response.data.success) {
      throw new ApiError("Failed to get cluster backups", 500, response.data);
    }
    return { success: true, backups: response.data.data, count: response.data.data?.length || 0, message: response.data.message };
  },

  listClusterBackups: async (clusterName: string) => {
    return provisioningApi.getClusterBackups(clusterName);
  },

  installSteamCmd: async (): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "SteamCMD installed successfully (mock)" }), 3000);
      });
    }
    const response = await api.post("/api/provisioning/install-steamcmd");
    return response.data;
  },

  addServerToCluster: async (clusterName: string, serverConfig: Record<string, unknown>): Promise<{ success: boolean; message: string; jobId?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Server added to cluster ${clusterName} (mock)`, jobId: "mock-job-id" }), 1000);
      });
    }
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/servers`, serverConfig);
    return response.data;
  },

  backupCluster: async (clusterName: string, options?: Record<string, unknown>): Promise<{ success: boolean; message: string; data?: { backupPath?: string } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Cluster ${clusterName} backed up (mock)`, data: { backupPath: `/mock/backups/${clusterName}` } }), 2000);
      });
    }
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`, options || {});
    return response.data;
  },

  restoreCluster: async (clusterName: string, options?: Record<string, unknown>): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Cluster ${clusterName} restored (mock)` }), 2000);
      });
    }
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`, options || {});
    return response.data;
  },

  listServerBackups: async (): Promise<{ success: boolean; data?: { backups?: unknown[] }; message?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, data: { backups: [] }, message: "No backups available (mock)" }), 500);
      });
    }
    const response = await api.get("/api/provisioning/server-backups");
    return response.data;
  },

  backupServer: async (serverName: string, options?: Record<string, unknown>): Promise<{ success: boolean; message: string; data?: { backupPath?: string } }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Server ${serverName} backed up (mock)`, data: { backupPath: `/mock/backups/${serverName}` } }), 2000);
      });
    }
    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(serverName)}/backup`, options || {});
    return response.data;
  },

  restoreServer: async (serverName: string, sourcePath: string, options?: Record<string, unknown>): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: `Server ${serverName} restored from ${sourcePath} (mock)` }), 2000);
      });
    }
    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(serverName)}/restore`, { sourcePath, ...options });
    return response.data;
  },
};
