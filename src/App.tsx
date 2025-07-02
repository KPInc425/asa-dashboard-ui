import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from './services';
import type { User } from './services';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContainerList from './components/ContainerList';
import RconConsole from './components/RconConsole';
import ConfigEditor from './components/ConfigEditor';
import LogViewer from './components/LogViewer';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Authentication context
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Auth provider component
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authApi.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    setUser(response.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-base-100 text-base-content ark-fade-in">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen">
                    <Sidebar />
                    <main className="flex-1 overflow-hidden">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/containers" element={<ContainerList />} />
                        <Route path="/rcon/:containerName" element={<RconConsole />} />
                        <Route path="/configs/:map" element={<ConfigEditor />} />
                        <Route path="/logs/:containerName" element={<LogViewer />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
