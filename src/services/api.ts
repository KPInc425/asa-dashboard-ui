import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * ARK Dashboard API Service
 * 
 * FRONTEND-ONLY MODE:
 * Set VITE_FRONTEND_ONLY=true in .env for testing without backend
 * Set VITE_FRONTEND_ONLY=false or remove from .env to use real backend API
 * 
 * Test credentials: admin / admin123
 */

// Types for API responses
export interface Container {
  name: string;
  status: 'running' | 'stopped' | 'restarting' | 'unknown';
  image?: string;
  ports?: any[];
  created?: string;
  labels?: Record<string, string>;
  type?: string;
  serverCount?: number;
  maps?: string;
  map?: string;
  clusterName?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
  players?: number; // <-- Added
}

export interface RconResponse {
  success: boolean;
  message: string;
  response?: string;
}

export interface ConfigFile {
  content: string;
  filename: string;
  map: string;
}

export interface LockStatus {
  locked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  reason?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  username: string;
  role?: string;
  permissions?: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    timezone?: string;
    language?: string;
  };
}

export interface ClusterBackup {
  clusterName: string;
  backupName: string;
  created: string;
  backupPath: string;
  size: number;
  type: string;
  hasMetadata: boolean;
}

export interface LogFile {
  name: string;
  path: string;
  size: number;
}

export interface LogFilesResponse {
  success: boolean;
  serverName: string;
  logFiles: LogFile[];
}

export interface LogContentResponse {
  success: boolean;
  serverName: string;
  fileName: string;
  content: string;
  lines: number;
}

export interface EnvironmentFile {
  success: boolean;
  content: string;
  variables: Record<string, string>;
  path: string;
}

export interface DockerComposeFile {
  success: boolean;
  content: string;
  path: string;
}

export interface ArkServer {
  name: string;
  lines: string[];
  startLine: number;
  endLine: number;
}

export interface ArkServerConfigs {
  success: boolean;
  servers: ArkServer[];
  count: number;
}

export interface Mod {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
}

export interface ModsResponse {
  success: boolean;
  mods: Mod[];
}

// API Error class for better error handling
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Create Axios instance with base configuration
const createApiInstance = (): AxiosInstance => {
  // Use custom endpoint from localStorage or fallback to environment variable
  const customEndpoint = localStorage.getItem('api_endpoint');
  const baseURL = customEndpoint || import.meta.env.VITE_API_URL || '/';
  
  console.log('Creating API instance with baseURL:', baseURL);
  
  const instance = axios.create({
    baseURL: baseURL,
    timeout: 300000, // 5 minutes (increased from 90 seconds to handle long SteamCMD updates)
    headers: {
      'Content-Type': 'application/json',
    },
    // Enable credentials for cross-origin requests
    withCredentials: true,
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      
      if (error.response) {
        // Server responded with error status
        const apiError = new ApiError(
          (error.response.data as any)?.message || 'An error occurred',
          error.response.status,
          error.response.data
        );
        return Promise.reject(apiError);
      } else if (error.request) {
        // Request was made but no response received
        const apiError = new ApiError(
          'No response from server. Please check your connection.',
          0
        );
        return Promise.reject(apiError);
      } else {
        // Something else happened
        const apiError = new ApiError(
          error.message || 'An unexpected error occurred',
          0
        );
        return Promise.reject(apiError);
      }
    }
  );

  return instance;
};

// Create the API instance with error handling
let api: AxiosInstance;
try {
  api = createApiInstance();
  console.log('API instance created successfully');
} catch (error) {
  console.error('Failed to create API instance:', error);
  // Create a fallback instance
  api = axios.create({
    baseURL: '/',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// Mock data for frontend-only mode
const MOCK_CONTAINERS: Container[] = [
  {
    name: 'asa-server-theisland',
    status: 'running',
    image: 'ark:latest',
    ports: ['7777:7777', '32330:32330'],
    created: '2024-01-15T10:30:00Z'
  },
  {
    name: 'asa-server-scorched',
    status: 'stopped',
    image: 'ark:latest',
    ports: ['7778:7777', '32331:32330'],
    created: '2024-01-16T14:20:00Z'
  },
  {
    name: 'asa-server-aberration',
    status: 'running',
    image: 'ark:latest',
    ports: ['7779:7777', '32332:32330'],
    created: '2024-01-17T09:15:00Z'
  },
  {
    name: 'asa-server-extinction',
    status: 'restarting',
    image: 'ark:latest',
    ports: ['7780:7777', '32333:32330'],
    created: '2024-01-18T16:45:00Z'
  }
];

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

const MOCK_LOCK_STATUS: LockStatus = {
  locked: false,
  lockedBy: undefined,
  lockedAt: undefined,
  reason: undefined
};

// Container Management API
export const containerApi = {
  /**
   * Get list of all containers
   */
  getContainers: async (): Promise<Container[]> => {
    if (FRONTEND_ONLY_MODE) {
      // Return mock data for frontend-only mode
      return MOCK_CONTAINERS;
    } else {
      const response = await api.get<{ success: boolean; containers: Container[] }>('/api/containers');
      return response.data.containers;
    }
  },

  /**
   * Get list of native servers (including cluster servers)
   */
  getNativeServers: async (): Promise<Container[]> => {
    if (FRONTEND_ONLY_MODE) {
      // Return mock data for frontend-only mode
      return MOCK_CONTAINERS;
    } else {
      const response = await api.get<{ success: boolean; servers: Container[] }>('/api/native-servers');
      return response.data.servers;
    }
  },

  /**
   * Start a native server by name
   */
  startNativeServer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: `Native server ${name} started successfully` };
    } else {
      try {
        if (!api) {
          throw new Error('API instance not available');
        }
        
        const response = await api.post<{ success: boolean; message: string }>(
          `/api/native-servers/${encodeURIComponent(name)}/start`
        );
        return response.data;
      } catch (error) {
        console.error('Failed to start native server:', error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            throw new Error(`Server start request timed out. The server may still be starting in the background.`);
          } else if (error.message.includes('Network Error')) {
            throw new Error(`Network error. Please check your connection to the server.`);
          } else if (error.message.includes('404')) {
            throw new Error(`Server not found. Please check the server name.`);
          } else {
            throw new Error(`Failed to start server: ${error.message}`);
          }
        } else {
          throw new Error('Failed to start server: Unknown error');
        }
      }
    }
  },

  /**
   * Check if a native server is running
   */
  isNativeServerRunning: async (name: string): Promise<boolean> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return Math.random() > 0.5; // Random status for demo
    } else {
      try {
        if (!api) {
          throw new Error('API instance not available');
        }
        
        const response = await api.get<{ success: boolean; running: boolean }>(
          `/api/native-servers/${encodeURIComponent(name)}/running`
        );
        return response.data.success && response.data.running;
      } catch (error) {
        console.error('Failed to check native server running status:', error);
        return false;
      }
    }
  },

  /**
   * Stop a native server by name
   */
  stopNativeServer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: `Native server ${name} stopped successfully` };
    } else {
      console.log(`🛑 Making stop request for native server: ${name}`);
      try {
        const response = await api.post<{ success: boolean; message: string }>(
          `/api/native-servers/${encodeURIComponent(name)}/stop`
        );
        console.log(`✅ Stop response:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Stop request failed:`, error);
        throw error;
      }
    }
  },

  /**
   * Restart a native server by name
   */
  restartNativeServer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, message: `Native server ${name} restarted successfully` };
    } else {
      console.log(`🔄 Making restart request for native server: ${name}`);
      try {
        const response = await api.post<{ success: boolean; message: string }>(
          `/api/native-servers/${encodeURIComponent(name)}/restart`
        );
        console.log(`✅ Restart response:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Restart request failed:`, error);
        throw error;
      }
    }
  },

  /**
   * Start a container by name
   */
  startContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: `Container ${name} started successfully` };
    } else {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/containers/${encodeURIComponent(name)}/start`
      );
      return response.data;
    }
  },

  /**
   * Stop a container by name
   */
  stopContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: `Container ${name} stopped successfully` };
    } else {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/containers/${encodeURIComponent(name)}/stop`
      );
      return response.data;
    }
  },

  /**
   * Restart a container by name
   */
  restartContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, message: `Container ${name} restarted successfully` };
    } else {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/containers/${encodeURIComponent(name)}/restart`
      );
      return response.data;
    }
  },

  /**
   * Send RCON command to a container
   */
  sendRconCommand: async (name: string, command: string): Promise<RconResponse> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock responses for common commands
      const mockResponses: Record<string, string> = {
        'listplayers': 'Players online: 3\n1. Player1 (SteamID: 123456789)\n2. Player2 (SteamID: 987654321)\n3. Player3 (SteamID: 456789123)',
        'saveworld': 'World saved successfully',
        'broadcast': 'Message broadcasted to all players',
        'kickplayer': 'Player kicked successfully',
        'banplayer': 'Player banned successfully',
        'destroywilddinos': 'All wild dinosaurs destroyed',
        'shutdown': 'Server shutdown initiated'
      };
      
      const response = mockResponses[command.toLowerCase()] || `Command executed: ${command}`;
      return { success: true, message: 'Command sent successfully', response };
    } else {
      const response = await api.post<RconResponse>(
        `/api/containers/${encodeURIComponent(name)}/rcon`,
        { command }
      );
      return response.data;
    }
  },

  /**
   * Send RCON command to a native server
   */
  sendNativeRconCommand: async (name: string, command: string): Promise<RconResponse> => {
    if (FRONTEND_ONLY_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock responses for common commands
      const mockResponses: Record<string, string> = {
        'listplayers': 'Players online: 3\n1. Player1 (SteamID: 123456789)\n2. Player2 (SteamID: 987654321)\n3. Player3 (SteamID: 456789123)',
        'saveworld': 'World saved successfully',
        'broadcast': 'Message broadcasted to all players',
        'kickplayer': 'Player kicked successfully',
        'banplayer': 'Player banned successfully',
        'destroywilddinos': 'All wild dinosaurs destroyed',
        'shutdown': 'Server shutdown initiated'
      };
      
      const response = mockResponses[command.toLowerCase()] || `Command executed: ${command}`;
      return { success: true, message: 'Command sent successfully', response };
    } else {
      const response = await api.post<RconResponse>(
        `/api/native-servers/${encodeURIComponent(name)}/rcon`,
        { command }
      );
      return response.data;
    }
  },

  /**
   * Get server mods configuration
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
   * Get native server start.bat content
   */
  getNativeServerStartBat: async (serverName: string): Promise<{ success: boolean; content: string; path: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            content: `@echo off
echo Starting ${serverName}...
"ArkAscendedServer.exe" "TheIsland?listen?SessionName=${serverName}?Port=7777?QueryPort=27015?RCONPort=32330?RCONEnabled=True?MaxPlayers=70?ServerPassword=?ServerAdminPassword=admin123" -mods=928102085,1404697612 -servergamelog -NotifyAdminCommandsInChat -UseDynamicConfig -ClusterDirOverride=C:\\ARK\\clusters\\MyCluster\\clusterdata -NoTransferFromFiltering -clusterid=MyCluster -NoBattleEye
echo Server ${serverName} has stopped.
pause`,
            path: `C:\\ARK\\clusters\\MyCluster\\${serverName}\\start.bat`
          });
        }, 500);
      });
    }

    const response = await api.get(`/api/native-servers/${serverName}/start-bat`);
    return response.data;
  },

  /**
   * Regenerate start.bat for a native server with latest mods and config
   */
  regenerateNativeServerStartBat: async (serverName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Start.bat regenerated for server ${serverName} with latest mods and configuration (mock)`
          });
        }, 1000);
      });
    }

    const response = await api.post(`/api/native-servers/${serverName}/regenerate-start-bat`);
    return response.data;
  },

  /**
   * Get config file content for a server
   */
  getConfigFile: async (serverName: string, fileName: string): Promise<{ content: string; fileName: string; serverName: string; configPath: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            content: `# Mock config content for ${fileName}\n# This is a placeholder for frontend-only mode`,
            fileName,
            serverName,
            configPath: `/mock/path/${fileName}`
          });
        }, 500);
      });
    }

    try {
      const response = await api.get(`/api/native-servers/${serverName}/config/${fileName}`);
      return response.data;
    } catch (error: any) {
      return { content: '', fileName, serverName, configPath: '' };
    }
  },

  /**
   * Update config file content for a server
   */
  updateConfigFile: async (serverName: string, content: string, fileName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Config file ${fileName} updated successfully (mock)`
          });
        }, 500);
      });
    }

    try {
      const response = await api.put(`/api/native-servers/${serverName}/config/${fileName}`, { content });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to update config file' };
    }
  },

  /**
   * Get server logs
   */
  getServerLogs: async (serverName: string, options: { follow?: boolean; lines?: number } = {}): Promise<{ success: boolean; content: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            content: `Mock server logs for ${serverName}...\n[INFO] Server started\n[INFO] Players connected: 5\n[INFO] World saved`
          });
        }, 500);
      });
    }

    try {
      const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/logs`, { params: options });
      return response.data;
    } catch (error: any) {
      return { success: false, content: error.response?.data?.message || 'Failed to get server logs' };
    }
  },

  /**
   * Get auto-shutdown configuration
   */
  getAutoShutdownConfig: async (): Promise<{ success: boolean; config: any }> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        config: {
          enabled: false,
          emptyTimeoutMinutes: 30,
          warningIntervals: [15, 10, 5, 2],
          warningMessage: 'Server will shut down in {time} minutes due to inactivity',
          excludeServers: []
        }
      };
    } else {
      const response = await api.get<{ success: boolean; config: any }>('/api/auto-shutdown/config');
      return response.data;
    }
  },

  /**
   * Update auto-shutdown configuration
   */
  updateAutoShutdownConfig: async (config: any): Promise<{ success: boolean }> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true };
    } else {
      const response = await api.post<{ success: boolean }>('/api/auto-shutdown/config', config);
      return response.data;
    }
  },

  // Save file management
  async getSaveFiles(serverName: string): Promise<{ success: boolean; files: any[]; message?: string }> {
    try {
      const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/save-files`);
      return response.data;
    } catch (error) {
      console.error('Error getting save files:', error);
      return { success: false, files: [], message: 'Failed to get save files' };
    }
  },

  async uploadSaveFile(serverName: string, formData: FormData): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading save file:', error);
      return { success: false, message: 'Failed to upload save file' };
    }
  },

  async downloadSaveFile(serverName: string, fileName: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob',
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error downloading save file:', error);
      return { success: false, message: 'Failed to download save file' };
    }
  },

  async backupSaveFiles(serverName: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/backup`);
      return response.data;
    } catch (error) {
      console.error('Error backing up save files:', error);
      return { success: false, message: 'Failed to backup save files' };
    }
  },

  async deleteSaveFile(serverName: string, fileName: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/${encodeURIComponent(fileName)}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting save file:', error);
      return { success: false, message: 'Failed to delete save file' };
    }
  },
};

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
  async getServerInfo(server: string): Promise<any> {
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

// Lock Status API
export const lockApi = {
  /**
   * Get current update lock status
   */
  getLockStatus: async (): Promise<LockStatus> => {
    if (FRONTEND_ONLY_MODE) {
      // Return mock lock status for frontend-only mode
      return MOCK_LOCK_STATUS;
    } else {
      const response = await api.get<LockStatus>('/api/lock-status');
      return response.data;
    }
  },
};

// Frontend-only mode flag - Set via environment variable
const FRONTEND_ONLY_MODE = import.meta.env.VITE_FRONTEND_ONLY === 'true';

// Mock user data for frontend-only mode
const MOCK_USER: User = {
  username: 'admin',
  role: 'admin',
  permissions: ['read', 'write', 'admin', 'user_management'],
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Administrator',
    email: 'admin@example.com',
    timezone: 'UTC',
    language: 'en'
  }
};

// Health check function
export const healthCheck = async (): Promise<boolean> => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || '/';
    const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error: unknown) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

// Authentication API
export const authApi = {
  /**
   * Login with username and password
   */
  login: async (username: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    if (FRONTEND_ONLY_MODE) {
      // Frontend-only authentication
      if (username === 'admin' && password === 'admin123') {
        const mockResponse: AuthResponse = {
          token: 'mock-jwt-token-' + Date.now(),
          user: MOCK_USER
        };
        
        localStorage.setItem('auth_token', mockResponse.token);
        return mockResponse;
      } else {
        throw new Error('Invalid credentials. Use admin/admin123 for testing.');
      }
    } else {
      // Real backend authentication
      const response = await api.post<{ success: boolean; token: string; user: any; rememberMe: boolean }>('/api/auth/login', {
        username,
        password,
        rememberMe,
      });
      
      // Handle backend response format
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        
        // Convert backend user format to frontend format
        const authResponse: AuthResponse = {
          token: response.data.token,
          user: {
            username: response.data.user.username,
            role: response.data.user.role,
            permissions: response.data.user.permissions,
            profile: response.data.user.profile
          }
        };
        
        return authResponse;
      } else {
        throw new Error('Authentication failed');
      }
    }
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    if (FRONTEND_ONLY_MODE) {
      // Return mock user for frontend-only mode
      const token = localStorage.getItem('auth_token');
      if (token && token.startsWith('mock-jwt-token')) {
        return MOCK_USER;
      }
      throw new Error('Not authenticated');
    } else {
      // Real backend call
      const response = await api.get<{ success: boolean; user: any }>('/api/auth/me');
      
      // Handle backend response format
      if (response.data.success && response.data.user) {
        return {
          username: response.data.user.username,
          role: response.data.user.role,
          permissions: response.data.user.permissions,
          profile: response.data.user.profile
        };
      } else {
        throw new Error('Failed to get user info');
      }
    }
  },

  /**
   * Logout and clear stored token
   */
  logout: (): void => {
    localStorage.removeItem('auth_token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

// Logs API (for WebSocket connection setup and file access)
export const logsApi = {
  /**
   * Get WebSocket URL for container logs
   * Note: This returns the URL for Socket.IO connection
   */
  getLogsUrl: (containerName: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return `${baseUrl}/api/logs/${encodeURIComponent(containerName)}`;
  },

  /**
   * Get available log files for a server
   */
  getLogFiles: async (serverName: string): Promise<LogFilesResponse> => {
    const response = await api.get(`/api/logs/${encodeURIComponent(serverName)}/files`);
    return response.data;
  },

  /**
   * Get recent log content from a specific file
   */
  getLogContent: async (serverName: string, fileName: string, lines: number = 100, forceRefresh: boolean = false): Promise<LogContentResponse> => {
    const params: Record<string, string | number> = { lines };
    if (forceRefresh) {
      params._t = Date.now(); // Cache-busting parameter
    }
    const response = await api.get(`/api/logs/${encodeURIComponent(serverName)}/files/${encodeURIComponent(fileName)}`, {
      params
    });
    return response.data;
  },

  /**
   * Debug endpoint to get log file information
   */
  debugLogFiles: async (serverName: string): Promise<{ success: boolean; serverName: string; logFiles: any[]; timestamp: string }> => {
    const response = await api.get(`/api/logs/${encodeURIComponent(serverName)}/debug`);
    return response.data;
  },

  /**
   * List log files for a server
   */
  listServerLogFiles: async (serverName: string): Promise<{ success: boolean; logFiles: Array<{ name: string; path: string; size: number; modified: string }> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            logFiles: [
              { name: 'ShooterGame.log', path: '/path/to/logs/ShooterGame.log', size: 1024, modified: new Date().toISOString() },
              { name: 'WindowsServer.log', path: '/path/to/logs/WindowsServer.log', size: 2048, modified: new Date().toISOString() }
            ]
          });
        }, 500);
      });
    }

    const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/log-files`);
    return response.data;
  },

  /**
   * Get save files for a server
   */
  getSaveFiles: async (serverName: string): Promise<{ success: boolean; files: Array<{ name: string; path: string; size: number; modified: string }> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            files: [
              { name: 'TheIsland.ark', path: '/saves/TheIsland.ark', size: 52428800, modified: new Date().toISOString() },
              { name: 'TheIsland.ark.bak', path: '/saves/TheIsland.ark.bak', size: 52428800, modified: new Date().toISOString() }
            ]
          });
        }, 500);
      });
    }

    const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/save-files`);
    return response.data;
  },

  /**
   * Upload save file to server
   */
  uploadSaveFile: async (serverName: string, formData: FormData): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Save file uploaded successfully (mock)'
          });
        }, 2000);
      });
    }

    const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Download save file from server
   */
  downloadSaveFile: async (serverName: string, fileName: string): Promise<{ success: boolean; data: ArrayBuffer; message?: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Create a mock file
          const mockData = new ArrayBuffer(1024);
          resolve({
            success: true,
            data: mockData,
            message: 'Save file downloaded successfully (mock)'
          });
        }, 1000);
      });
    }

    const response = await api.get(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/download/${encodeURIComponent(fileName)}`, {
      responseType: 'arraybuffer'
    });
    return {
      success: true,
      data: response.data
    };
  },

  /**
   * Delete save file from server
   */
  deleteSaveFile: async (serverName: string, fileName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Save file ${fileName} deleted successfully (mock)`
          });
        }, 500);
      });
    }

    const response = await api.delete(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/${encodeURIComponent(fileName)}`);
    return response.data;
  },

  /**
   * Backup save files for a server
   */
  backupSaveFiles: async (serverName: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Save files backed up successfully (mock)'
          });
        }, 2000);
      });
    }

    const response = await api.post(`/api/native-servers/${encodeURIComponent(serverName)}/save-files/backup`);
    return response.data;
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

// Environment Management API
export const environmentApi = {
  /**
   * Get environment file content
   */
  getEnvironmentFile: async (): Promise<EnvironmentFile> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        content: `# ASA Management Suite Environment Configuration
NODE_ENV=development
PORT=4000
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key-here
NATIVE_BASE_PATH=C:\\ARK
STEAMCMD_PATH=C:\\SteamCMD`,
        variables: {
          NODE_ENV: 'development',
          PORT: '4000',
          LOG_LEVEL: 'info',
          CORS_ORIGIN: 'http://localhost:5173',
          JWT_SECRET: 'your-secret-key-here',
          NATIVE_BASE_PATH: 'C:\\ARK',
          STEAMCMD_PATH: 'C:\\SteamCMD'
        },
        path: '.env'
      };
    } else {
      const response = await api.get<EnvironmentFile>('/api/environment');
      return response.data;
    }
  },

  /**
   * Update environment file content
   */
  updateEnvironmentFile: async (content: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Environment file updated successfully' };
    } else {
      const response = await api.put<{ success: boolean; message: string }>('/api/environment', { content });
      return response.data;
    }
  },

  /**
   * Update specific environment variable
   */
  updateEnvironmentVariable: async (key: string, value: string): Promise<{ success: boolean; message: string; path: string; variables: Record<string, string> }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Environment variable ${key} updated successfully (mock)`,
            path: '/mock/.env',
            variables: { [key]: value }
          });
        }, 500);
      });
    }

    const response = await api.put(`/api/environment/${key}`, { value });
    return response.data;
  },

  /**
   * Get Docker Compose file content
   */
  getDockerComposeFile: async (): Promise<DockerComposeFile> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        content: `version: '3.8'
services:
  asa-control-api:
    build: ./asa-docker-control-api
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped`,
        path: 'docker-compose.yml'
      };
    } else {
      const response = await api.get<DockerComposeFile>('/api/docker-compose');
      return response.data;
    }
  },

  /**
   * Update Docker Compose file content
   */
  updateDockerComposeFile: async (content: string): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Docker Compose file updated successfully' };
    } else {
      const response = await api.put<{ success: boolean; message: string }>('/api/docker-compose', { content });
      return response.data;
    }
  },

  /**
   * Get ARK server configurations
   */
  getArkServerConfigs: async (): Promise<ArkServerConfigs> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        servers: [
          {
            name: 'asa-server-theisland',
            lines: ['[/script/shootergame/shootergamemode]', 'HarvestAmountMultiplier=3.0', 'XPMultiplier=3.0'],
            startLine: 1,
            endLine: 3
          },
          {
            name: 'asa-server-ragnarok',
            lines: ['[/script/shootergame/shootergamemode]', 'HarvestAmountMultiplier=2.5', 'XPMultiplier=2.5'],
            startLine: 1,
            endLine: 3
          }
        ],
        count: 2
      };
    } else {
      const response = await api.get<ArkServerConfigs>('/api/ark-servers');
      return response.data;
    }
  },

  /**
   * Add new ARK server
   */
  addArkServer: async (serverConfig: any): Promise<{ success: boolean; message: string; path: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `ARK server ${serverConfig.name} added successfully (mock)`,
            path: '/mock/docker-compose.yml'
          });
        }, 1000);
      });
    }

    const response = await api.post('/api/ark-servers', serverConfig);
    return response.data;
  },

  /**
   * Update ARK server
   */
  updateArkServer: async (name: string, serverConfig: any): Promise<{ success: boolean; message: string; path: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `ARK server ${name} updated successfully (mock)`,
            path: '/mock/docker-compose.yml'
          });
        }, 1000);
      });
    }

    const response = await api.put(`/api/ark-servers/${name}`, serverConfig);
    return response.data;
  },

  /**
   * Remove ARK server
   */
  removeArkServer: async (name: string): Promise<{ success: boolean; message: string; path: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `ARK server ${name} removed successfully (mock)`,
            path: '/mock/docker-compose.yml'
          });
        }, 1000);
      });
    }

    const response = await api.delete(`/api/ark-servers/${name}`);
    return response.data;
  },

  /**
   * Reload Docker Compose configuration
   */
  reloadDockerCompose: async (): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Docker Compose configuration reloaded successfully (mock)'
          });
        }, 2000);
      });
    }

    const response = await api.post('/api/docker-compose/reload');
    return response.data;
  },

  /**
   * Get available mods
   */
  getMods: async (): Promise<ModsResponse> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            mods: [
              {
                id: '123456789',
                name: 'Structures Plus',
                description: 'Enhanced building system for ARK',
                author: 'Orionsun',
                version: '1.0.0'
              },
              {
                id: '987654321',
                name: 'Stackable Foundations',
                description: 'Allows stacking of foundation pieces',
                author: 'ModAuthor',
                version: '2.1.0'
              },
              {
                id: '555666777',
                name: 'Advanced Rafts',
                description: 'Enhanced raft building and functionality',
                author: 'RaftModder',
                version: '1.5.0'
              }
            ]
          });
        }, 500);
      });
    }

    const response = await api.get('/api/mods');
    return response.data;
  }
};

// Provisioning API
export const provisioningApi = {
  /**
   * Get system information for provisioning
   */
  getSystemInfo: async (): Promise<any> => {
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
  getRequirements: async (): Promise<any> => {
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
   * Install SteamCMD
   */
  installSteamCmd: async (foreground: boolean = false): Promise<{ success: boolean; message: string }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'SteamCMD installed successfully (mock)'
          });
        }, 3000);
      });
    }

    const response = await api.post('/api/provisioning/install-steamcmd', { foreground });
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
  getModsOverview: async (): Promise<{ success: boolean; overview: { sharedMods: number[]; serverMods: Record<string, any>; totalServers: number } }> => {
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
    logFiles: any; 
    serviceInfo: any;
    type: string; 
    lines: number;
    totalLogFiles: number;
  }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            logFiles: {
              combined: {
                content: 'Log file: combined.log\nPath: /logs/combined.log\nSize: 45.23 KB\nModified: 2024-01-15T10:30:00.000Z\nLines: 1000 total, showing last 100\n────────────────────────────────────────────────────────────────────────────────\n[INFO] Server started\n[INFO] Request received',
                path: '/logs/combined.log',
                exists: true
              },
              error: {
                content: 'Log file: error.log\nPath: /logs/error.log\nSize: 2.15 KB\nModified: 2024-01-15T10:30:00.000Z\nLines: 50 total, showing last 100\n────────────────────────────────────────────────────────────────────────────────\n[ERROR] Connection failed\n[ERROR] Invalid request',
                path: '/logs/error.log',
                exists: true
              }
            },
            serviceInfo: {
              mode: 'native',
              isWindowsService: false,
              serviceInstallPath: null,
              logBasePath: '/app',
              currentWorkingDirectory: '/app',
              processId: 1234,
              parentProcessId: 1
            },
            type,
            lines,
            totalLogFiles: 2
          });
        }, 500);
      });
    }

    const response = await api.get(`/api/provisioning/system-logs?type=${type}&lines=${lines}`);
    return response.data;
  },

  /**
   * List clusters
   */
  listClusters: async (): Promise<{ success: boolean; clusters: any[] }> => {
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
  getClusterDetails: async (clusterName: string): Promise<{ success: boolean; cluster: any }> => {
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
  createCluster: async (clusterConfig: any): Promise<{ success: boolean; cluster?: any; message: string; jobId?: string }> => {
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
  getJobStatus: async (jobId: string): Promise<{ success: boolean; job?: any; message: string }> => {
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
  deleteCluster: async (name: string, options?: { backupSaved?: boolean; deleteFiles?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
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
   * Backup cluster
   */
  backupCluster: async (clusterName: string, options?: { destination?: string; saves?: boolean; configs?: boolean; logs?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`, options || {});
    return response.data;
  },

  /**
   * Restore cluster
   */
  restoreCluster: async (clusterName: string, options?: { source?: string; saves?: boolean; configs?: boolean; logs?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await api.post(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`, options || {});
    return response.data;
  },

  /**
   * Backup individual server
   */
  backupServer: async (name: string, options?: { destination?: string; includeConfigs?: boolean; includeScripts?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Server ${name} backed up successfully (mock)`,
            data: { backupPath: '/mock/server/backup/path' }
          });
        }, 2000);
      });
    }

    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(name)}/backup`, options || {});
    return response.data;
  },

  /**
   * Restore individual server
   */
  restoreServer: async (name: string, source: string, options?: { targetClusterName?: string; overwrite?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `Server ${name} restored successfully (mock)`,
            data: { sourcePath: source, targetCluster: options?.targetClusterName || 'original' }
          });
        }, 3000);
      });
    }

    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(name)}/restore`, {
      source,
      ...options
    });
    return response.data;
  },

  /**
   * List server backups
   */
  listServerBackups: async (): Promise<{ success: boolean; message: string; data?: any }> => {
    if (FRONTEND_ONLY_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Server backups retrieved successfully (mock)',
            data: {
              backups: [
                {
                  name: 'TestServer-2024-01-15T10-30-45-123Z',
                  path: '/mock/backup/path',
                  serverName: 'TestServer',
                  originalCluster: 'TestCluster',
                  backupDate: new Date().toISOString(),
                  size: 1024000,
                  sizeFormatted: '1.0 MB'
                }
              ],
              count: 1
            }
          });
        }, 500);
      });
    }

    const response = await api.get('/api/provisioning/server-backups');
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
   * List cluster backups (alias for getClusterBackups)
   */
  listClusterBackups: async (clusterName: string) => {
    return provisioningApi.getClusterBackups(clusterName);
  },
};

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

export const createServer = async (serverConfig: any): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>('/api/provisioning/create-server', serverConfig);
  if (!response.data.success) {
    throw new ApiError('Failed to create server', 500, response.data);
  }
  return response.data;
};

export const createCluster = async (clusterConfig: any): Promise<{ success: boolean; message: string }> => {
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

export const getServers = async (): Promise<any[]> => {
  const response = await api.get<{ success: boolean; servers: any[] }>('/api/provisioning/servers');
  if (!response.data.success) {
    throw new ApiError('Failed to get servers', 500, response.data);
  }
  return response.data.servers;
};

export const getClusters = async (): Promise<any[]> => {
  const response = await api.get<{ success: boolean; clusters: any[] }>('/api/provisioning/clusters');
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

export const deleteCluster = async (clusterName: string, options?: { backupSaved?: boolean; deleteFiles?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
  const params = new URLSearchParams();
  if (options?.backupSaved !== undefined) params.append('backupSaved', options.backupSaved.toString());
  if (options?.deleteFiles !== undefined) params.append('deleteFiles', options.deleteFiles.toString());
  
  const url = `/api/provisioning/clusters/${encodeURIComponent(clusterName)}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.delete<{ success: boolean; message: string; data?: any }>(url);
  if (!response.data.success) {
    throw new ApiError('Failed to delete cluster', 500, response.data);
  }
  return response.data;
};

export const backupCluster = async (clusterName: string, destination?: string): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await api.post<{ success: boolean; message: string; data?: any }>(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/backup`, {
    destination
  });
  if (!response.data.success) {
    throw new ApiError('Failed to backup cluster', 500, response.data);
  }
  return response.data;
};

export const restoreCluster = async (clusterName: string, source: string): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await api.post<{ success: boolean; message: string; data?: any }>(`/api/provisioning/clusters/${encodeURIComponent(clusterName)}/restore`, {
    source
  });
  if (!response.data.success) {
    throw new ApiError('Failed to restore cluster', 500, response.data);
  }
  return response.data;
};

export const backupServer = async (serverName: string, options?: { destination?: string; includeConfigs?: boolean; includeScripts?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await api.post<{ success: boolean; message: string; data?: any }>(`/api/provisioning/servers/${encodeURIComponent(serverName)}/backup`, options || {});
  if (!response.data.success) {
    throw new ApiError('Failed to backup server', 500, response.data);
  }
  return response.data;
};

export const restoreServer = async (serverName: string, source: string, options?: { targetClusterName?: string; overwrite?: boolean }): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await api.post<{ success: boolean; message: string; data?: any }>(`/api/provisioning/servers/${encodeURIComponent(serverName)}/restore`, {
    source,
    ...options
  });
  if (!response.data.success) {
    throw new ApiError('Failed to restore server', 500, response.data);
  }
  return response.data;
};

export const listServerBackups = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await api.get<{ success: boolean; message: string; data?: any }>('/api/provisioning/server-backups');
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
  getServerUpdateConfig: async (serverName: string): Promise<any> => {
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
  updateServerUpdateConfig: async (serverName: string, config: any): Promise<any> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: 'Update configuration updated successfully' };
    }
    const response = await api.put(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-config`, config);
    return response.data;
  },

  /**
   * Check server update status
   */
  checkServerUpdateStatus: async (serverName: string): Promise<any> => {
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
  updateServerWithConfig: async (serverName: string, options: { force?: boolean; updateConfig?: boolean; background?: boolean }): Promise<any> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: `Server ${serverName} updated successfully` };
    }
    const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-with-config`, options);
    return response.data;
  },

  /**
   * Update server settings
   */
  updateServerSettings: async (serverName: string, settings: any, options: { regenerateConfigs?: boolean; regenerateScripts?: boolean } = {}): Promise<any> => {
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
  updateAllServersWithConfig: async (options: { force?: boolean; updateConfig?: boolean; skipDisabled?: boolean }): Promise<any> => {
    if (FRONTEND_ONLY_MODE) {
      return { success: true, message: 'Update process completed. Updated: 3, Skipped: 0, Failed: 0' };
    }
    const response = await api.post('/api/provisioning/update-all-servers-with-config', options);
    return response.data;
  },

  /**
   * Get update status for all servers
   */
  getUpdateStatusAll: async (): Promise<any> => {
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
    successful: any[];
    failed: any[];
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
   * Get system logs
   */
  getSystemLogs: async (type: string = 'all', lines: number = 100): Promise<{
    success: boolean;
    serviceInfo?: any;
    logFiles?: any;
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
          logBasePath: process.cwd(),
          currentWorkingDirectory: process.cwd(),
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
   * Get system info
   */
  getSystemInfo: async (): Promise<{
    success: boolean;
    status?: any;
    message?: string;
  }> => {
    if (FRONTEND_ONLY_MODE) {
      return {
        success: true,
        status: {
          systemInfo: {
            platform: 'win32',
            arch: 'x64',
            nodeVersion: '18.0.0',
            memory: { total: 16000000000, free: 8000000000 },
            disk: { total: 1000000000000, free: 500000000000 }
          },
          serviceInfo: {
            mode: 'native',
            isWindowsService: false,
            serviceInstallPath: null,
            logBasePath: process.cwd(),
            currentWorkingDirectory: process.cwd(),
            processId: 12345,
            parentProcessId: 1234
          }
        }
      };
    }
    
    const response = await api.get('/api/provisioning/system-info');
    return response.data;
  },

  // Re-export existing provisioning functions for convenience
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
};

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

export { api };

export default apiService; 