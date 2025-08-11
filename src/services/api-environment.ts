import { api, FRONTEND_ONLY_MODE } from './api-core';
import type { EnvironmentFile, DockerComposeFile, ArkServerConfigs, ModsResponse } from './api-core';

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
  addArkServer: async (serverConfig: Record<string, unknown>): Promise<{ success: boolean; message: string; path: string }> => {
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
  updateArkServer: async (name: string, serverConfig: Record<string, unknown>): Promise<{ success: boolean; message: string; path: string }> => {
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
