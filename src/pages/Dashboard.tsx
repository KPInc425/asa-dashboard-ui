import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { containerApi, lockApi, type Container, type LockStatus } from '../services';

// Add Port type for Dockerode port objects
interface Port {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

// Helper to render port info
const renderPort = (portObj: Port) => {
  if (!portObj) return '-';
  if (typeof portObj === 'string') return portObj;
  const { IP, PrivatePort, PublicPort, Type } = portObj;
  if (PublicPort) {
    return `${IP ? IP + ':' : ''}${PublicPort} → ${PrivatePort}/${Type}`;
  }
  return `${PrivatePort}/${Type}`;
};

const API_SUITE_NAMES = [
  'asa-control-api',
  'asa-control-grafana',
  'asa-control-prometheus',
  'asa-control-cadvisor',
];
const HIDDEN_KEY = 'ark_dashboard_hidden_containers';
const getHiddenContainers = () => {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
  } catch {
    return [];
  }
};
const setHiddenContainers = (arr: string[]) => {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr));
};

const SYSTEM_LINKS: Record<string, { label: string; url: string }> = {
  'asa-control-grafana': { label: 'Grafana', url: 'http://ark.ilgaming.xyz:3001' },
  'asa-control-prometheus': { label: 'Prometheus', url: 'http://ark.ilgaming.xyz:9090' },
  'asa-control-cadvisor': { label: 'cAdvisor', url: 'http://ark.ilgaming.xyz:8080' },
  'asa-control-api': { label: 'API Logs', url: '/api/logs/asa-control-api' },
};

const Dashboard = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [hidden, setHidden] = useState<string[]>(getHiddenContainers());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [containersData, lockData] = await Promise.all([
          containerApi.getContainers(),
          lockApi.getLockStatus()
        ]);
        // Label-based hiding
        const hiddenByLabel = containersData.filter(c => c.labels && c.labels['ark.dashboard.exclude'] === 'true').map(c => c.name);
        const allHidden = Array.from(new Set([...hidden, ...hiddenByLabel]));
        setHidden(allHidden);
        setHiddenContainers(allHidden);
        setLockStatus(lockData);
        // Filter containers for display
        setContainers(
          containersData.filter(c =>
            !API_SUITE_NAMES.includes(c.name) &&
            (showHidden ? true : !allHidden.includes(c.name))
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [showHidden]);

  // Hide/unhide logic (update UI immediately)
  const handleHide = (name: string) => {
    const newHidden = Array.from(new Set([...hidden, name]));
    setHidden(newHidden);
    setHiddenContainers(newHidden);
    setContainers(containers.filter(c => c.name !== name));
  };
  const handleUnhide = (name: string) => {
    const newHidden = hidden.filter(n => n !== name);
    setHidden(newHidden);
    setHiddenContainers(newHidden);
    // Add back to containers if it matches filter
    // (In a real app, you'd re-fetch, but here we just update state)
  };

  const runningServers = containers.filter(c => c.status === 'running').length;
  const totalServers = containers.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-success';
      case 'stopped': return 'text-error';
      case 'restarting': return 'text-warning';
      default: return 'text-base-content/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'restarting': return '🟡';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-base-content/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">ARK Dashboard</h1>
          <p className="text-sm sm:text-base text-base-content/70">Monitor and manage your survival servers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 lg:p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70 text-xs lg:text-sm">Total Servers</p>
                <p className="text-2xl lg:text-3xl font-bold text-primary">{totalServers}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-xl lg:text-2xl">🖥️</span>
              </div>
            </div>
          </div>

          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 lg:p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70 text-xs lg:text-sm">Running Servers</p>
                <p className="text-2xl lg:text-3xl font-bold text-success">{runningServers}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-success to-info rounded-lg flex items-center justify-center">
                <span className="text-xl lg:text-2xl">🟢</span>
              </div>
            </div>
          </div>

          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 lg:p-6 animate-in slide-in-from-bottom-4 duration-500 sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70 text-xs lg:text-sm">Update Lock</p>
                <p className="text-2xl lg:text-3xl font-bold text-warning">
                  {lockStatus?.locked ? '🔒' : '🔓'}
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-warning to-error rounded-lg flex items-center justify-center">
                <span className="text-xl lg:text-2xl">🔒</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle hidden containers */}
        <div className="mb-4">
          <label className="cursor-pointer label">
            <span className="label-text">Show hidden containers</span>
            <input type="checkbox" className="toggle toggle-primary ml-2" checked={showHidden} onChange={() => setShowHidden(!showHidden)} />
          </label>
        </div>

        {/* Hidden containers list */}
        {showHidden && hidden.length > 0 && (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">Hidden Containers</h2>
            <ul>
              {hidden.map(name => (
                <li key={name} className="flex items-center justify-between mb-1">
                  <span>{name}</span>
                  <button className="btn btn-xs btn-outline btn-success ml-2" onClick={() => handleUnhide(name)}>
                    Unhide
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Server List */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Server Status</h2>
            <Link 
              to="/containers" 
              className="btn btn-primary btn-sm bg-gradient-to-br from-primary to-accent hover:shadow-lg hover:shadow-primary/25"
            >
              View All
            </Link>
          </div>

          {containers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-base-content/70">No servers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {containers.slice(0, 6).map((container, index) => (
                <div 
                  key={container.name}
                  className="bg-base-300 rounded-lg p-4 hover:scale-105 transition-all duration-200"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base-content truncate">
                      {container.name}
                    </h3>
                    <span className="text-2xl">{getStatusIcon(container.status)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-base-content/70">Status:</span>
                      <span className={getStatusColor(container.status)}>
                        {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                      </span>
                    </div>
                    
                    {container.ports && container.ports.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-base-content/70">Ports:</span>
                        <span className="flex flex-col gap-1">
                          {container.ports.map((port, i) => (
                            <span key={i} className="badge badge-outline badge-xs">
                              {renderPort(port)}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Link
                      to={`/rcon/${container.name}`}
                      className="btn btn-sm btn-outline btn-primary flex-1"
                    >
                      RCON
                    </Link>
                    <Link
                      to={`/logs/${container.name}`}
                      className="btn btn-sm btn-outline btn-info flex-1"
                    >
                      Logs
                    </Link>
                    <button
                      className="btn btn-sm btn-outline btn-error flex-1"
                      onClick={() => handleHide(container.name)}
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-2xl font-bold text-primary mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/containers"
              className="btn btn-outline btn-primary w-full hover:shadow-lg hover:shadow-primary/25"
            >
              <span className="text-xl mr-2">🖥️</span>
              Manage Servers
            </Link>
            
            {/* Configs page now uses query params for server/file selection */}
            <Link
              to="/configs"
              className="btn btn-outline btn-secondary w-full hover:shadow-lg hover:shadow-secondary/25"
            >
              <span className="text-xl mr-2">⚙️</span>
              Edit Configs
            </Link>
            
            <button className="btn btn-outline btn-accent w-full hover:shadow-lg hover:shadow-accent/25">
              <span className="text-xl mr-2">📊</span>
              View Stats
            </button>
            
            <button className="btn btn-outline btn-info w-full hover:shadow-lg hover:shadow-info/25">
              <span className="text-xl mr-2">🔧</span>
              System Info
            </button>
          </div>
        </div>

        {/* System Containers Section */}
        {containers.length > 0 && (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">System Containers</h2>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Container</th>
                    <th>Status</th>
                    <th>Ports</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.filter(c => API_SUITE_NAMES.includes(c.name)).map((container) => (
                    <tr key={container.name}>
                      <td>{container.name}</td>
                      <td>{getStatusIcon(container.status)} {container.status}</td>
                      <td>
                        {container.ports && container.ports.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {container.ports.map((port, i) => (
                              <span key={i} className="badge badge-outline badge-sm">
                                {renderPort(port)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                      <td>
                        {SYSTEM_LINKS[container.name] ? (
                          <a href={SYSTEM_LINKS[container.name].url} className="btn btn-xs btn-primary" target="_blank" rel="noopener noreferrer">
                            {SYSTEM_LINKS[container.name].label}
                          </a>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {containers.filter(c => API_SUITE_NAMES.includes(c.name)).map((container) => (
                <div key={container.name} className="bg-base-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-base-content">{container.name}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg">{getStatusIcon(container.status)}</span>
                        <span className={`badge ${getStatusColor(container.status)}`}>
                          {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {container.ports && container.ports.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm text-base-content/70 mb-1">Ports:</div>
                      <div className="flex flex-wrap gap-1">
                        {container.ports.map((port, i) => (
                          <span key={i} className="badge badge-outline badge-xs">
                            {renderPort(port)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {SYSTEM_LINKS[container.name] && (
                    <div>
                      <a 
                        href={SYSTEM_LINKS[container.name].url} 
                        className="btn btn-xs btn-primary w-full" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {SYSTEM_LINKS[container.name].label}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 