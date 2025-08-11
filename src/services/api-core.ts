import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * ARK Dashboard API Service - Core Types and Setup
 * 
 * FRONTEND-ONLY MODE:
 * Set VITE_FRONTEND_ONLY=true in .env for testing without backend
 * Set VITE_FRONTEND_ONLY=false or remove from .env to use real backend API
 * 
 * Test credentials: admin / admin123
 */

// Core Types for API responses
export interface Container {
  name: string;
  status: 'running' | 'stopped' | 'restarting' | 'unknown';
  image?: string;
  ports?: string[];
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
  players?: number;
}

export interface RconResponse {
  success: boolean;
  message: string;
  response?: string;
  cached?: boolean;
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
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Frontend-only mode flag - Set via environment variable
export const FRONTEND_ONLY_MODE = import.meta.env.VITE_FRONTEND_ONLY === 'true';

// Mock user data for frontend-only mode
export const MOCK_USER: User = {
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
          (error.response.data as { message?: string })?.message || 'An error occurred',
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

// Export the API instance
export { api };
