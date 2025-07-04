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

  // Hide/unhide logic
  const handleHide = (name: string) => {
    const newHidden = Array.from(new Set([...hidden, name]));
    setHidden(newHidden);
    setHiddenContainers(newHidden);
    // Re-fetch to update view
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100); // quick refresh
  };
  const handleUnhide = (name: string) => {
    const newHidden = hidden.filter(n => n !== name);
    setHidden(newHidden);
    setHiddenContainers(newHidden);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100);
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
          <div className="ark-rotate inline-block mb-4">
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
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="ark-slide-in">
          <h1 className="text-4xl font-bold text-primary mb-2">ARK Dashboard</h1>
          <p className="text-base-content/70">Monitor and manage your survival servers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70 text-sm">Total Servers</p>
                <p className="text-3xl font-bold text-primary">{totalServers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🖥️</span>
              </div>
            </div>
          </div>

          <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70 text-sm">Running Servers</p>
                <p className="text-3xl font-bold text-success">{runningServers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-success to-info rounded-lg flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
            </div>
          </div>

          <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/70 text-sm">Update Lock</p>
                <p className="text-3xl font-bold text-warning">
                  {lockStatus?.locked ? '🔒' : '🔓'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-warning to-error rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔒</span>
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
          <div className="ark-glass rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">Hidden Containers</h2>
            <ul>
              {hidden.map(name => (
                <li key={name} className="flex items-center justify-between mb-1">
                  <span>{name}</span>
                  <button className="btn btn-xs btn-outline btn-success ml-2" onClick={() => handleUnhide(name)}>Unhide</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Server List */}
        <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Server Status</h2>
            <Link 
              to="/containers" 
              className="btn btn-primary btn-sm ark-gradient-primary ark-hover-glow"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {containers.slice(0, 6).map((container, index) => (
                <div 
                  key={container.name}
                  className="bg-base-300 rounded-lg p-4 ark-hover-scale transition-all duration-200"
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
                        <span className="text-base-content">
                          {container.ports.map(renderPort).join(', ')}
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
        <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-2xl font-bold text-primary mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/containers"
              className="btn btn-outline btn-primary w-full ark-hover-glow"
            >
              <span className="text-xl mr-2">🖥️</span>
              Manage Servers
            </Link>
            
            <Link
              to="/configs/TheIsland"
              className="btn btn-outline btn-secondary w-full ark-hover-glow"
            >
              <span className="text-xl mr-2">⚙️</span>
              Edit Configs
            </Link>
            
            <button className="btn btn-outline btn-accent w-full ark-hover-glow">
              <span className="text-xl mr-2">📊</span>
              View Stats
            </button>
            
            <button className="btn btn-outline btn-info w-full ark-hover-glow">
              <span className="text-xl mr-2">🔧</span>
              System Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 