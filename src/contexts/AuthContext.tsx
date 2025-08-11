import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsFirstTimeSetup: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  completeFirstTimeSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsFirstTimeSetup, setNeedsFirstTimeSetup] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          
          // Check if this is the default admin user that needs first-time setup
          const isDefaultAdmin = currentUser?.username === 'admin' && 
                                (currentUser?.profile?.firstName === 'Admin' || !currentUser?.profile?.firstName);
          setNeedsFirstTimeSetup(isDefaultAdmin);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authApi.logout();
        setUser(null); // Ensure user is set to null when auth check fails
        setNeedsFirstTimeSetup(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authApi.login(username, password, rememberMe);
      setUser(response.user);
      
      // Check if this is the default admin user that needs first-time setup
      const isDefaultAdmin = response.user?.username === 'admin' && 
                            (response.user?.profile?.firstName === 'Admin' || !response.user?.profile?.firstName);
      setNeedsFirstTimeSetup(isDefaultAdmin);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setNeedsFirstTimeSetup(false);
  };

  const completeFirstTimeSetup = () => {
    setNeedsFirstTimeSetup(false);
    // Refresh user data to get updated profile
    if (user) {
      authApi.getCurrentUser().then(updatedUser => {
        setUser(updatedUser);
      }).catch(console.error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    needsFirstTimeSetup,
    login,
    logout,
    completeFirstTimeSetup,
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