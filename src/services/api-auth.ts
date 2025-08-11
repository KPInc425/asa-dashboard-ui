import { api, FRONTEND_ONLY_MODE, MOCK_USER } from './api-core';
import type { AuthResponse, User } from './api-core';

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
      const response = await api.post<{ success: boolean; token: string; user: Record<string, unknown>; rememberMe: boolean }>('/api/auth/login', {
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
            username: response.data.user.username as string,
            role: response.data.user.role as string,
            permissions: response.data.user.permissions as string[],
            profile: response.data.user.profile as User['profile']
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
      const response = await api.get<{ success: boolean; user: Record<string, unknown> }>('/api/auth/me');
      
      // Handle backend response format
      if (response.data.success && response.data.user) {
        return {
          username: response.data.user.username as string,
          role: response.data.user.role as string,
          permissions: response.data.user.permissions as string[],
          profile: response.data.user.profile as User['profile']
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
