import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { containerApi, type Container } from '../services';
import { containerNameToServerName } from '../utils';
// Use containerApi.sendRconCommand for RCON

const API_SUITE_NAMES = [
  'asa-control-api',
  'asa-control-grafana',
  'asa-control-prometheus',
  'asa-control-cadvisor',
];

const SYSTEM_LINKS: Record<string, { label: string; url: string }> = {
  'asa-control-grafana': { label: 'Grafana', url: '/grafana' },
  'asa-control-prometheus': { label: 'Prometheus', url: '/prometheus' },
  'asa-control-cadvisor': { label: 'cAdvisor', url: '/cadvisor' },
  'asa-control-api': { label: 'API Logs', url: '/api/logs/asa-control-api' },
};

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

// Add Port type for Dockerode port objects
export interface Port {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

const ContainerList = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [systemContainers, setSystemContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [hidden, setHidden] = useState<string[]>(getHiddenContainers());

  useEffect(() => {
    fetchContainers();
    // eslint-disable-next-line
  }, []);

  const fetchContainers = async () => {
    try {
      const data = await containerApi.getContainers();
      // Label-based hiding
      const hiddenByLabel = data.filter(c => c.labels && c.labels['ark.dashboard.exclude'] === 'true').map(c => c.name);
      const allHidden = Array.from(new Set([...hidden, ...hiddenByLabel]));
      setHidden(allHidden);
      setHiddenContainers(allHidden);
      // System containers
      setSystemContainers(data.filter(c => API_SUITE_NAMES.includes(c.name)));
      // ARK containers (not system, not hidden unless showHidden)
      setContainers(
        data.filter(c =>
          !API_SUITE_NAMES.includes(c.name) &&
          (showHidden ? true : !allHidden.includes(c.name))
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load containers');
    } finally {
      setIsLoading(false);
    }
  };

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
    // Optionally, re-fetch or update containers list if needed
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart', containerName: string) => {
    setActionLoading(containerName);
    try {
      switch (action) {
        case 'start':
          await containerApi.startContainer(containerName);
          break;
        case 'stop':
          // Save world before stopping
          try {
            await containerApi.sendRconCommand(containerName, 'saveworld');
          } catch (e) {
            console.warn('Failed to save world before stopping:', e);
          }
          await containerApi.stopContainer(containerName);
          break;
        case 'restart':
          await containerApi.restartContainer(containerName);
          break;
      }
      // Refresh the list after action
      await fetchContainers();
    } catch (err) {
      console.error(`Failed to ${action} container:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'badge-success';
      case 'stopped': return 'badge-error';
      case 'restarting': return 'badge-warning';
      default: return 'badge-neutral';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="ark-rotate inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="text-base-content/70">Loading servers...</p>
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

  // Hidden containers

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="ark-slide-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Server Management</h1>
          <p className="text-base-content/70">Control your ARK: Survival Ascended servers</p>
        </div>

        {/* Toggle hidden containers */}
        <div className="mb-4">
          <label className="cursor-pointer label">
            <span className="label-text">Show hidden containers</span>
            <input type="checkbox" className="toggle toggle-primary ml-2" checked={showHidden} onChange={() => { setShowHidden(!showHidden); fetchContainers(); }} />
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

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="ark-glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{containers.length}</div>
            <div className="text-sm text-base-content/70">Total Servers</div>
          </div>
          <div className="ark-glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {containers.filter(c => c.status === 'running').length}
            </div>
            <div className="text-sm text-base-content/70">Running</div>
          </div>
          <div className="ark-glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-error">
              {containers.filter(c => c.status === 'stopped').length}
            </div>
            <div className="text-sm text-base-content/70">Stopped</div>
          </div>
          <div className="ark-glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {containers.filter(c => c.status === 'restarting').length}
            </div>
            <div className="text-sm text-base-content/70">Restarting</div>
          </div>
        </div>

        {/* Server List */}
        <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.2s' }}>
          {containers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-base-content/70 mb-4">No servers found</p>
              <p className="text-sm text-base-content/50">Start by creating your first ARK server</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Server</th>
                    <th>Status</th>
                    <th>Ports</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((container, index) => (
                    <tr 
                      key={container.name}
                      // Removed ark-hover-scale to prevent scrollbars on hover
                      className="transition-all duration-200"
                      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                    >
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="avatar placeholder">
                            <div className="bg-gradient-to-br from-primary to-accent text-primary-content rounded-full w-10">
                              <span className="text-lg">🦖</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{container.name}</div>
                            {container.image && (
                              <div className="text-sm opacity-50">{container.image}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getStatusIcon(container.status)}</span>
                          <span className={`badge ${getStatusColor(container.status)}`}>
                            {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                          </span>
                        </div>
                      </td>
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
                        {container.created ? (
                          <span className="text-sm text-base-content/70">
                            {new Date(container.created).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-xs btn-success"
                            title="Start Container"
                            disabled={container.status === 'running' || actionLoading === container.name}
                            onClick={() => handleAction('start', container.name)}
                          >
                            ▶
                          </button>
                          <button
                            className="btn btn-xs btn-warning"
                            title="Restart Container"
                            disabled={container.status !== 'running' || actionLoading === container.name}
                            onClick={() => handleAction('restart', container.name)}
                          >
                            ↻
                          </button>
                          <button
                            className="btn btn-xs btn-error"
                            title="Stop Container"
                            disabled={container.status !== 'running' || actionLoading === container.name}
                            onClick={() => handleAction('stop', container.name)}
                          >
                            ■
                          </button>
                          <Link
                            to={`/logs/${container.name}`}
                            className="btn btn-xs btn-info"
                            title="View Logs"
                          >
                            📝
                          </Link>
                          <Link
                            to={`/rcon/${container.name}`}
                            className="btn btn-xs btn-primary"
                            title="Open RCON Console"
                          >
                            ⌨️
                          </Link>
                          <Link
                            to={`/configs?server=${encodeURIComponent(containerNameToServerName(container.name))}`}
                            className="btn btn-xs btn-secondary"
                            title="Edit Config"
                          >
                            ⚙️
                          </Link>
                          <button
                            className="btn btn-xs btn-outline btn-error"
                            title="Hide Container"
                            onClick={() => handleHide(container.name)}
                          >
                            Hide
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {containers.length > 0 && (
          <div className="ark-glass rounded-xl p-6 ark-slide-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold text-primary mb-4">Bulk Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  containers.forEach(container => {
                    if (container.status === 'stopped') {
                      handleAction('start', container.name);
                    }
                  });
                }}
                className="btn btn-success btn-sm ark-gradient-primary ark-hover-glow"
              >
                🚀 Start All Stopped
              </button>
              <button
                onClick={() => {
                  containers.forEach(container => {
                    if (container.status === 'running') {
                      handleAction('stop', container.name);
                    }
                  });
                }}
                className="btn btn-error btn-sm ark-gradient-secondary ark-hover-glow"
              >
                🛑 Stop All Running
              </button>
              <button
                onClick={() => {
                  containers.forEach(container => {
                    if (container.status === 'running') {
                      handleAction('restart', container.name);
                    }
                  });
                }}
                className="btn btn-warning btn-sm ark-hover-glow"
              >
                🔄 Restart All Running
              </button>
            </div>
          </div>
        )}

        {/* System Containers Section */}
        {systemContainers.length > 0 && (
          <div className="ark-glass rounded-xl p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">System Containers</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Container</th>
                    <th>Status</th>
                    <th>Ports</th>
                    <th>Links</th>
                    <th>Hide</th>
                  </tr>
                </thead>
                <tbody>
                  {systemContainers.map((container) => (
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
                      <td>
                        <button className="btn btn-xs btn-outline btn-error" onClick={() => handleHide(container.name)}>Hide</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerList; 