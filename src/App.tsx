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
import Configs from './pages/Configs';
import EnvironmentEditor from './components/EnvironmentEditor';

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

// Main layout using daisyUI drawer
const MainLayout = () => {
  return (
    <div className="drawer lg:drawer-open h-screen">
      {/* Drawer toggle for mobile */}
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Mobile navbar/header */}
        <div className="w-full navbar bg-base-200 border-b border-base-300 lg:hidden">
          <div className="flex-none">
            <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost drawer-button">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div className="flex-1 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-sm">🦖</span>
            </div>
            <span className="font-bold text-primary">ARK Dashboard</span>
          </div>
        </div>
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/containers" element={<ContainerList />} />
            <Route path="/rcon/:containerName" element={<RconConsole />} />
            <Route path="/configs" element={<Configs />} />
            <Route path="/configs/:map" element={<ConfigEditor />} />
            <Route path="/environment" element={<EnvironmentEditor />} />
            <Route path="/logs/:containerName" element={<LogViewer />} />
          </Routes>
        </div>
      </div>
      <div className="drawer-side">
        <label htmlFor="dashboard-drawer" className="drawer-overlay lg:hidden"></label>
        <Sidebar />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-base-100 text-base-content animate-in fade-in duration-500">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout />
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
