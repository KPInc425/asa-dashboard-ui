import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview and statistics'
    },
    {
      path: '/servers',
      label: 'Servers',
      icon: '🦖',
      description: 'Manage ARK servers (containers & native)'
    },
    {
      path: '/configs',
      label: 'Configs',
      icon: '📝',
      description: 'Edit server configurations'
    },
    {
      path: '/rcon',
      label: 'RCON',
      icon: '⌨️',
      description: 'RCON console and chat for all servers'
    },
    {
      path: '/system-logs',
      label: 'System Logs',
      icon: '🔧',
      description: 'API and system logs'
    },
    {
      path: '/provisioning',
      label: 'Provisioning',
      icon: '🏗️',
      description: 'Create servers and clusters'
    },
    {
      path: '/discord',
      label: 'Discord',
      icon: '💬',
      description: 'Discord webhooks and bot setup'
    }
  ];

  // Add admin-only menu items
  const adminMenuItems = user?.permissions?.includes('user_management') ? [
    {
      path: '/users',
      label: 'User Management',
      icon: '👥',
      description: 'Manage users and permissions'
    }
  ] : [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-base-100 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:relative lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-content text-lg">🦖</span>
              </div>
              <h1 className="text-lg font-semibold text-base-content">ASA Management Suite</h1>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden btn btn-ghost btn-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group
                  ${isActive(item.path) 
                    ? 'bg-primary text-primary-content shadow-lg' 
                    : 'hover:bg-base-200 text-base-content'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${isActive(item.path) ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Admin-only section */}
            {adminMenuItems.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <div className="text-xs font-medium text-base-content/50 uppercase tracking-wider">
                    Administration
                  </div>
                </div>
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group
                      ${isActive(item.path) 
                        ? 'bg-primary text-primary-content shadow-lg' 
                        : 'hover:bg-base-200 text-base-content'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${isActive(item.path) ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-base-300">
            <div className="text-xs text-base-content/50 text-center">
              ASA Management Suite v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 