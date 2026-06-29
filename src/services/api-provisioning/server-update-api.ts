import { api, FRONTEND_ONLY_MODE } from "../api-core";

export const serverUpdateApi = {
  getServerUpdateConfig: async (
    serverName: string,
  ): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        data: {
          serverName,
          clusterName: "TestCluster",
          updateOnStart: true,
          lastUpdate: new Date().toISOString(),
          updateEnabled: true,
          autoUpdate: false,
          updateInterval: 24,
          updateSchedule: null,
        },
      };
    }
    const response = await api.get(
      `/api/provisioning/servers/${encodeURIComponent(serverName)}/update-config`,
    );
    return response.data;
  },

  updateServerUpdateConfig: async (
    serverName: string,
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        message: "Update configuration updated successfully",
      };
    }
    const response = await api.put(
      `/api/provisioning/servers/${encodeURIComponent(serverName)}/update-config`,
      config,
    );
    return response.data;
  },

  checkServerUpdateStatus: async (
    serverName: string,
  ): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        data: {
          needsUpdate: false,
          reason: "No update needed",
          lastUpdate: new Date().toISOString(),
          updateEnabled: true,
        },
      };
    }
    const response = await api.get(
      `/api/provisioning/servers/${encodeURIComponent(serverName)}/update-status`,
    );
    return response.data;
  },

  updateServerWithConfig: async (
    serverName: string,
    options: { force?: boolean; updateConfig?: boolean; background?: boolean },
  ): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        message: `Server ${serverName} updated successfully`,
      };
    }
    const response = await api.post(
      `/api/provisioning/servers/${encodeURIComponent(serverName)}/update-with-config`,
      options,
    );
    return response.data;
  },

  updateServerSettings: async (
    serverName: string,
    settings: Record<string, unknown>,
    options: { regenerateConfigs?: boolean; regenerateScripts?: boolean } = {},
  ): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        message: `Server ${serverName} settings updated successfully`,
      };
    }
    const response = await api.post(
      `/api/provisioning/servers/${encodeURIComponent(serverName)}/update-settings`,
      { settings, ...options },
    );
    return response.data;
  },

  updateAllServersWithConfig: async (options: {
    force?: boolean;
    updateConfig?: boolean;
    skipDisabled?: boolean;
  }): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        message: "Update process completed. Updated: 3, Skipped: 0, Failed: 0",
      };
    }
    const response = await api.post(
      "/api/provisioning/update-all-servers-with-config",
      options,
    );
    return response.data;
  },

  getUpdateStatusAll: async (): Promise<Record<string, unknown>> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        data: [
          {
            serverName: "TestServer1",
            clusterName: "TestCluster",
            status: {
              needsUpdate: false,
              reason: "No update needed",
              lastUpdate: new Date().toISOString(),
              updateEnabled: true,
            },
            config: {
              serverName: "TestServer1",
              clusterName: "TestCluster",
              updateOnStart: true,
              lastUpdate: new Date().toISOString(),
              updateEnabled: true,
              autoUpdate: false,
              updateInterval: 24,
              updateSchedule: null,
            },
          },
        ],
      };
    }
    const response = await api.get("/api/provisioning/update-status-all");
    return response.data;
  },
};
