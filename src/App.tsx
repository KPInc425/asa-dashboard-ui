import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import ServerDetails from './pages/ServerDetails';
import ClusterDetails from './pages/ClusterDetails';
import Configs from './pages/Configs';
// import RconConsole from './components/RconConsole';
import LogViewer from './components/LogViewer';
import ServerLogViewer from './components/ServerLogViewer';
import Provisioning from './pages/Provisioning';
import SystemLogs from './pages/SystemLogs';
import Login from './pages/Login';
import UserProfile from './components/UserProfile';
import UserManagement from './components/UserManagement';
import FirstTimeSetup from './components/FirstTimeSetup';

// Protected Route Component (currently unused but kept for future use)
// const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-base-200">
//         <div className="text-center">
//           <div className="loading loading-spinner loading-lg text-primary"></div>
//           <p className="mt-4 text-base-content">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return <>{children}</>;
// };

const Header: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-base-100 shadow-sm border-b border-base-300">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-ghost btn-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {user && user.username ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-base-content/70">Welcome,</span>
              <span className="text-sm font-medium text-base-content">{user.username}</span>
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                  <li className="menu-title">
                    <span className="text-sm text-base-content/70">Signed in as</span>
                  </li>
                  <li>
                    <span className="text-sm font-medium text-base-content">{user.username}</span>
                  </li>
                  <li className="divider"></li>
                  <li>
                    <Link to="/profile" className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </Link>
                  </li>
                  {user.permissions?.includes('user_management') && (
                    <li>
                      <Link to="/users" className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>User Management</span>
                      </Link>
                    </li>
                  )}
                  <li className="divider"></li>
                  <li>
                    <button onClick={logout} className="text-error flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/70">Not signed in</div>
          )}
        </div>
      </div>
    </header>
  );
};

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, needsFirstTimeSetup, completeFirstTimeSetup } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-200">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  // If user needs first-time setup, show setup page
  if (needsFirstTimeSetup) {
    return <FirstTimeSetup onComplete={completeFirstTimeSetup} />;
  }

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/servers/:serverName" element={<ServerDetails />} />
            <Route path="/clusters/:clusterName" element={<ClusterDetails />} />
            <Route path="/configs" element={<Configs />} />
            <Route path="/logs" element={<LogViewer />} />
            <Route path="/logs/:serverName" element={<ServerLogViewer />} />
            <Route path="/system-logs" element={<SystemLogs />} />
            <Route path="/provisioning" element={<Provisioning />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
