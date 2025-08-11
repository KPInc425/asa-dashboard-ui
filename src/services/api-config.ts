import { api, FRONTEND_ONLY_MODE } from './api-core';
import type { ConfigFile } from './api-core';

const MOCK_CONFIG_CONTENT = `# ARK Server Configuration
ServerName=My ARK Server
ServerPassword=
ServerAdminPassword=admin123
MaxPlayers=70
DifficultyOffset=1.0
HarvestAmountMultiplier=2.0
XPMultiplier=2.0
TamingSpeedMultiplier=3.0
MatingIntervalMultiplier=0.5
BabyMatureSpeedMultiplier=5.0
BabyCuddleIntervalMultiplier=0.5
BabyCuddleGracePeriodMultiplier=2.0
BabyCuddleLoseImprintQualitySpeedMultiplier=0.5
BabyImprintAmountMultiplier=2.0
BabyImprintQualityMultiplier=2.0
BabyImprintQualitySpeedMultiplier=2.0
BabyImprintQualitySpeedMultiplier=2.0
BabyImprintQualitySpeedMultiplier=2.0
BabyImprintQualitySpeedMultiplier=2.0
BabyImprintQualitySpeedMultiplier=2.0`;

// Configuration Management API
export const configApi = {
  /**
   * List all available ASA servers
   */
  async listServers(): Promise<{ servers: string[]; count: number; rootPath: string }> {
    const response = await api.get('/api/servers');
    if (!response.data.success) throw new Error('Failed to list servers');
    return response.data;
  },

  /**
   * Get server info (including config files)
   */
  async getServerInfo(server: string): Promise<Record<string, unknown>> {
    const response = await api.get(`/api/servers/${encodeURIComponent(server)}`);
    if (!response.data.success) throw new Error('Failed to get server info');
    return response.data;
  },

  /**
   * List config files for a server
   */
  async listConfigFiles(server: string): Promise<{ files: string[]; serverName: string; path: string; defaultFiles: string[] }> {
    const response = await api.get(`/api/servers/${encodeURIComponent(server)}/config/files`);
    if (!response.data.success) throw new Error('Failed to list config files');
    return response.data;
  },

  /**
   * Get config file content for a server
   */
  async getConfigFile(server: string, file: string): Promise<{ content: string; filePath: string; fileName: string; serverName: string; configPath: string }> {
    const response = await api.get(`/api/servers/${encodeURIComponent(server)}/config`, { params: { file } });
    if (!response.data.success) throw new Error('Failed to get config file');
    return response.data;
  },

  /**
   * Update config file content for a server
   */
  async updateConfigFile(server: string, content: string, file: string): Promise<{ success: boolean; message: string; filePath: string; fileName: string; serverName: string; configPath: string }> {
    const response = await api.put(`/api/servers/${encodeURIComponent(server)}/config`, { content, file });
    if (!response.data.success) throw new Error('Failed to update config file');
    return response.data;
  },

  // Legacy methods for compatibility (can be removed after frontend refactor)
  loadConfig: async (map: string): Promise<ConfigFile> => {
    if (FRONTEND_ONLY_MODE) {
      // Return mock config for frontend-only mode
      return {
        content: MOCK_CONFIG_CONTENT,
        filename: `${map.toLowerCase()}.ini`,
        map: map
      };
    } else {
      const response = await api.get<ConfigFile>(`/api/configs/${encodeURIComponent(map)}`);
      return response.data;
    }
  },
  saveConfig: async (map: string, content: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, message: `Configuration for ${map} saved successfully` };
    } else {
      const response = await api.put<{ success: boolean; message: string }>(
        `/api/configs/${encodeURIComponent(map)}`,
        { content }
      );
      return response.data;
    }
  },
};

// ARK Config File API
export const getArkConfigFile = async (serverName: string, fileName: 'Game.ini' | 'GameUserSettings.ini') => {
  const response = await api.get(`/api/configs/ark/${encodeURIComponent(serverName)}/${encodeURIComponent(fileName)}`);
  return response.data;
};

export const updateArkConfigFile = async (serverName: string, fileName: 'Game.ini' | 'GameUserSettings.ini', content: string) => {
  const response = await api.put(`/api/configs/ark/${encodeURIComponent(serverName)}/${encodeURIComponent(fileName)}`, { content });
  return response.data;
};

export const getServerConfigInfo = async (serverName: string) => {
  const response = await api.get(`/api/configs/ark/${encodeURIComponent(serverName)}/info`);
  return response.data;
};
