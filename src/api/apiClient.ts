/**
 * Centralized API Client
 * 
 * This module provides a configured axios instance with:
 * - Base URL configuration from environment
 * - Request/response interceptors for error handling
 * - Auth token handling
 * - ProblemDetails error transformation
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ProblemDetails } from '../types/serverStatus';
import { isProblemDetails } from '../types/serverStatus';

/**
 * Custom API error that includes ProblemDetails information
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly problemDetails?: ProblemDetails;
  public readonly retryAfter?: number;
  public readonly serverId?: string;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      problemDetails?: ProblemDetails;
      retryAfter?: number;
      serverId?: string;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.problemDetails = options?.problemDetails;
    this.retryAfter = options?.retryAfter;
    this.serverId = options?.serverId;
  }

  /**
   * Check if this error is a specific error code
   */
  isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if this error should trigger a retry
   */
  shouldRetry(): boolean {
    return this.retryAfter !== undefined && this.retryAfter > 0;
  }
}

/**
 * Get the API base URL from environment or localStorage
 */
function getBaseUrl(): string {
  // Check localStorage for custom endpoint (user-configurable)
  const customEndpoint = localStorage.getItem('api_endpoint');
  if (customEndpoint) {
    return customEndpoint;
  }

  // Use environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== '/') {
    return envUrl;
  }

  // In development, default to localhost:4000
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:4000';
  }

  // In production, use relative URL (handled by reverse proxy)
  return '';
}

/**
 * Create a configured axios instance
 */
function createApiClient(): AxiosInstance {
  const baseURL = getBaseUrl();

  const client = axios.create({
    baseURL,
    timeout: 300000, // 5 minutes for long operations
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - transform errors to ApiError
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle network/timeout errors
      if (!error.response) {
        const message = error.code === 'ECONNABORTED'
          ? 'Request timed out. The server may be busy.'
          : 'No response from server. Please check your connection.';
        
        return Promise.reject(new ApiError(message, 0));
      }

      const { status, data } = error.response;

      // Check if response is ProblemDetails format
      if (isProblemDetails(data)) {
        return Promise.reject(
          new ApiError(data.detail || data.title, status, {
            code: data.code,
            problemDetails: data,
            retryAfter: data.retryAfter,
            serverId: data.serverId,
          })
        );
      }

      // Handle legacy error format
      const legacyData = data as { message?: string; error?: string };
      const message = legacyData?.message || legacyData?.error || 'An error occurred';

      return Promise.reject(new ApiError(message, status));
    }
  );

  return client;
}

/**
 * The main API client instance
 * 
 * Usage:
 * ```typescript
 * import { apiClient } from './api/apiClient';
 * 
 * const response = await apiClient.get('/api/servers');
 * ```
 */
export const apiClient = createApiClient();

/**
 * Recreate the API client (useful after changing base URL)
 */
export function resetApiClient(): AxiosInstance {
  const newClient = createApiClient();
  Object.assign(apiClient, newClient);
  return apiClient;
}

/**
 * Update the API base URL at runtime
 */
export function setApiBaseUrl(url: string): void {
  localStorage.setItem('api_endpoint', url);
  resetApiClient();
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  return getBaseUrl();
}

/**
 * Check if the API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

export default apiClient;
