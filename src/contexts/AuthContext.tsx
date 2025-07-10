import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...');
        const hasToken = authApi.isAuthenticated();
        console.log('🔍 Has token:', hasToken);
        
        if (hasToken) {
          console.log('🔍 Token found, getting current user...');
          const currentUser = await authApi.getCurrentUser();
          console.log('🔍 Current user:', currentUser);
          setUser(currentUser);
        } else {
          console.log('🔍 No token found, user not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        authApi.logout();
        setUser(null); // Ensure user is set to null when auth check fails
      } finally {
        setIsLoading(false);
        console.log('🔍 Auth check completed, isLoading:', false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 