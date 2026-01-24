/**
 * Auto-Update API Service
 * Handles all API calls for the auto-update feature
 */

import { api, FRONTEND_ONLY_MODE } from './api-core';
import type {
  AutoUpdateConfig,
  AutoUpdateServerConfig,
  AutoUpdateConfigResponse,
  AutoUpdateServerConfigResponse,
  AutoUpdateStatusResponse,
  AutoUpdateCheckResponse,
  AutoUpdateTriggerResponse,
  AutoUpdateCancelResponse,
  AutoUpdateHistoryResponse,
  TestNotificationResponse,
  NotificationChannel,
  UpdateEvent,
  UpdateStatus
} from '../types/autoUpdate';

// Mock data for frontend-only mode
const MOCK_CONFIG: AutoUpdateConfig = {
  enabled: false,
  checkIntervalMinutes: 60,
  updateIfEmpty: true,
  forceUpdate: false,
  notifications: {
    rcon: true,
    discord: true,
    socket: true
  },
  warningMinutes: [30, 10, 5, 1],
  messageTemplates: {
    rcon: {
      warning: 'Server will restart for update in {time} minutes',
      updating: 'Server is now updating. Please wait...',
      completed: 'Server update completed successfully!',
      failed: 'Server update failed. Please contact an administrator.'
    },
    discord: {
      warning: '⚠️ **{serverName}** will restart for update in **{time} minutes**',
      updating: '🔄 **{serverName}** is now updating...',
      completed: '✅ **{serverName}** update completed successfully!',
      failed: '❌ **{serverName}** update failed: {error}'
    }
  },
  servers: {}
};

const MOCK_EVENTS: UpdateEvent[] = [
  {
    id: '1',
    serverName: 'TheIsland',
    status: 'completed',
    message: 'Update completed successfully',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    fromVersion: '1.0.1',
    toVersion: '1.0.2'
  },
  {
    id: '2',
    serverName: 'TheIsland',
    status: 'checking',
    message: 'Checking for updates...',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];

export const autoUpdateApi = {
  /**
   * Get global auto-update configuration
   */
  getConfig: async (): Promise<AutoUpdateConfigResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, config: MOCK_CONFIG };
    }
    
    try {
      // Use the global status endpoint since /config doesn't exist
      const response = await api.get<{ success: boolean; schedulerRunning: boolean }>('/api/auto-update/status');
      // Build a config from the status response
      return {
        success: response.data.success,
        config: {
          ...MOCK_CONFIG,
          enabled: response.data.schedulerRunning
        }
      };
    } catch (error) {
      console.error('Failed to get auto-update config:', error);
      throw error;
    }
  },

  /**
   * Update global auto-update configuration
   */
  updateConfig: async (config: Partial<AutoUpdateConfig>): Promise<AutoUpdateConfigResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, config: { ...MOCK_CONFIG, ...config } };
    }
    
    try {
      // Use scheduler endpoints since global /config doesn't exist
      if (config.enabled !== undefined) {
        const endpoint = config.enabled 
          ? '/api/auto-update/scheduler/start'
          : '/api/auto-update/scheduler/stop';
        await api.post(endpoint);
      }
      
      // Return the updated config
      return {
        success: true,
        config: { ...MOCK_CONFIG, ...config }
      };
    } catch (error) {
      console.error('Failed to update auto-update config:', error);
      throw error;
    }
  },

  /**
   * Get server-specific auto-update configuration
   */
  getServerConfig: async (serverName: string): Promise<AutoUpdateServerConfigResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        serverName,
        config: {
          enabled: Math.random() > 0.5,
          serverName,
          lastCheck: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          updateAvailable: Math.random() > 0.7,
          currentVersion: '1.0.1',
          latestVersion: '1.0.2'
        }
      };
    }
    
    try {
      const response = await api.get<AutoUpdateServerConfigResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/config`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get auto-update config for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Update server-specific auto-update configuration
   */
  updateServerConfig: async (
    serverName: string,
    config: Partial<AutoUpdateServerConfig>
  ): Promise<AutoUpdateServerConfigResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        serverName,
        config: {
          enabled: config.enabled ?? false,
          serverName,
          ...config
        }
      };
    }
    
    try {
      const response = await api.put<AutoUpdateServerConfigResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/config`,
        config
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update auto-update config for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Get current update status for a server
   */
  getStatus: async (serverName: string): Promise<AutoUpdateStatusResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const statuses: UpdateStatus[] = ['idle', 'checking', 'warning', 'updating', 'completed', 'failed'];
      return {
        success: true,
        serverName,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        updateAvailable: Math.random() > 0.7,
        currentVersion: '1.0.1',
        latestVersion: '1.0.2',
        lastCheck: new Date(Date.now() - Math.random() * 3600000).toISOString()
      };
    }
    
    try {
      const response = await api.get<AutoUpdateStatusResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/status`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get update status for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Check for updates for a specific server
   */
  checkForUpdates: async (serverName: string): Promise<AutoUpdateCheckResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        success: true,
        serverName,
        updateAvailable: Math.random() > 0.5,
        currentVersion: '1.0.1',
        latestVersion: '1.0.2',
        message: 'Update check completed'
      };
    }
    
    try {
      const response = await api.post<AutoUpdateCheckResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/check`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to check for updates for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Trigger an update for a specific server
   */
  triggerUpdate: async (serverName: string, force?: boolean): Promise<AutoUpdateTriggerResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        serverName,
        jobId: `job-${Date.now()}`,
        message: 'Update started'
      };
    }
    
    try {
      const response = await api.post<AutoUpdateTriggerResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/run-now`,
        { force }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to trigger update for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Cancel an ongoing update for a specific server
   */
  cancelUpdate: async (serverName: string): Promise<AutoUpdateCancelResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        serverName,
        message: 'Update cancelled'
      };
    }
    
    try {
      const response = await api.post<AutoUpdateCancelResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/cancel`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to cancel update for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Get update history for a specific server
   */
  getHistory: async (serverName: string, limit?: number): Promise<AutoUpdateHistoryResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        serverName,
        events: MOCK_EVENTS.slice(0, limit || 10)
      };
    }
    
    try {
      const response = await api.get<AutoUpdateHistoryResponse>(
        `/api/auto-update/servers/${encodeURIComponent(serverName)}/history`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get update history for ${serverName}:`, error);
      throw error;
    }
  },

  /**
   * Send a test notification to specific channels
   */
  testNotification: async (
    channel: NotificationChannel,
    serverName?: string
  ): Promise<TestNotificationResponse> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        channel,
        message: `Test notification sent to ${channel}`
      };
    }
    
    try {
      // Backend expects `channels` object with boolean flags
      const channels: Record<string, boolean> = {
        rcon: channel === 'rcon',
        discord: channel === 'discord',
        socket: channel === 'socket'
      };
      
      const response = await api.post<TestNotificationResponse>(
        '/api/auto-update/test-notification',
        { 
          serverName: serverName || 'default',
          channels,
          message: `[TEST] This is a test notification to ${channel}`
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to send test notification to ${channel}:`, error);
      throw error;
    }
  },

  /**
   * Get all servers' update status
   */
  getAllStatus: async (): Promise<{ success: boolean; servers: Record<string, AutoUpdateStatusResponse> }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        servers: {
          'TheIsland': {
            success: true,
            serverName: 'TheIsland',
            status: 'idle',
            updateAvailable: false,
            currentVersion: '1.0.2',
            lastCheck: new Date().toISOString()
          },
          'Ragnarok': {
            success: true,
            serverName: 'Ragnarok',
            status: 'warning',
            updateAvailable: true,
            currentVersion: '1.0.1',
            latestVersion: '1.0.2',
            lastCheck: new Date().toISOString()
          }
        }
      };
    }
    
    try {
      const response = await api.get<{ 
        success: boolean; 
        schedulerRunning: boolean;
        servers: Array<{
          serverName: string;
          status: UpdateStatus;
          lastCheck: string | null;
          nextCheck: string | null;
          updateAvailable: boolean;
          enabled: boolean;
          schedulerActive: boolean;
        }>;
      }>('/api/auto-update/status');
      
      // Transform array response to object keyed by serverName
      const serversMap: Record<string, AutoUpdateStatusResponse> = {};
      for (const server of response.data.servers || []) {
        serversMap[server.serverName] = {
          success: true,
          serverName: server.serverName,
          status: server.status,
          updateAvailable: server.updateAvailable,
          lastCheck: server.lastCheck || undefined
        };
      }
      
      return {
        success: response.data.success,
        servers: serversMap
      };
    } catch (error) {
      console.error('Failed to get all servers update status:', error);
      throw error;
    }
  },

  /**
   * Check all servers for updates
   */
  checkAllForUpdates: async (): Promise<{ success: boolean; results: Record<string, AutoUpdateCheckResponse> }> => {
    if (FRONTEND_ONLY_MODE) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        results: {
          'TheIsland': {
            success: true,
            serverName: 'TheIsland',
            updateAvailable: false,
            currentVersion: '1.0.2',
            message: 'No updates available'
          },
          'Ragnarok': {
            success: true,
            serverName: 'Ragnarok',
            updateAvailable: true,
            currentVersion: '1.0.1',
            latestVersion: '1.0.2',
            message: 'Update available'
          }
        }
      };
    }
    
    try {
      const response = await api.post<{ success: boolean; message: string; checkedServers: number }>(
        '/api/auto-update/check-now'
      );
      // Transform response to match expected format
      return {
        success: response.data.success,
        results: {} // Backend doesn't return detailed results, just triggers check
      };
    } catch (error) {
      console.error('Failed to check all servers for updates:', error);
      throw error;
    }
  }
};

export default autoUpdateApi;
