import { api, FRONTEND_ONLY_MODE } from './api-core';
import type { LogFilesResponse, LogContentResponse } from './api-core';

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
    // Temporary: use /api/logfiles/* to bypass proxy rules on /api/logs/*
    const response = await api.get(`/api/logfiles/${encodeURIComponent(serverName)}/files`);
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
    // Temporary: use /api/logfiles/* to bypass proxy rules on /api/logs/*
    const response = await api.get(`/api/logfiles/${encodeURIComponent(serverName)}/files/${encodeURIComponent(fileName)}`, {
      params
    });
    return response.data;
  },

  /**
   * Debug endpoint to get log file information
   */
  debugLogFiles: async (serverName: string): Promise<{ success: boolean; serverName: string; logFiles: Array<{ name: string; path: string; size: number }>; timestamp: string }> => {
    // Temporary: point to list endpoint for debugging
    const response = await api.get(`/api/logfiles/${encodeURIComponent(serverName)}/files`);
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
