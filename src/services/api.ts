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
  ports?: string[];
  created?: string;
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
  user: {
    username: string;
    role?: string;
  };
}

export interface User {
  username: string;
  role?: string;
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
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
    timeout: 30000, // 30 seconds
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
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
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

// Create the API instance
const api = createApiInstance();

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
      const response = await api.get<Container[]>('/api/containers');
      return response.data;
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
};

// Configuration Management API
export const configApi = {
  /**
   * Load configuration file for a specific map
   */
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

  /**
   * Save configuration file for a specific map
   */
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
  role: 'admin'
};

// Authentication API
export const authApi = {
  /**
   * Login with username and password
   */
  login: async (username: string, password: string): Promise<AuthResponse> => {
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
      const response = await api.post<AuthResponse>('/api/auth/login', {
        username,
        password,
      });
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
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
      const response = await api.get<User>('/api/auth/me');
      return response.data;
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

// Logs API (for WebSocket connection setup)
export const logsApi = {
  /**
   * Get WebSocket URL for container logs
   * Note: This returns the URL for Socket.IO connection
   */
  getLogsUrl: (containerName: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return `${baseUrl}/api/logs/${encodeURIComponent(containerName)}`;
  },
};

// Export the main API instance for custom requests
export { api };

// Export all APIs as a single object for convenience
export const apiService = {
  containers: containerApi,
  config: configApi,
  lock: lockApi,
  auth: authApi,
  logs: logsApi,
};

export default apiService; 