import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/containers', label: 'Servers', icon: '🖥️' },
    { path: '/configs', label: 'Configs', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 h-full bg-base-200 border-r border-base-300 flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-base-300">
        <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center animate-pulse">
            <span className="text-xl">🦖</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-primary">ARK Dashboard</h1>
            <p className="text-xs text-base-content/70">Server Management</p>
            <div className="badge badge-warning badge-xs mt-1">Frontend Mode</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-0">
        <ul className="menu menu-lg menu-vertical rounded-none">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive: navIsActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-none transition-all duration-200 hover:scale-105 ${
                    isActive(item.path) || navIsActive
                      ? 'bg-primary text-primary-content shadow-lg shadow-primary/25'
                      : 'text-base-content hover:bg-base-300'
                  }`
                }
                end={item.path === '/'}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-accent-content">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-base-content/70">{user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 