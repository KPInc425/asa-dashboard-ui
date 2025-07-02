import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { containerApi, type Container } from '../services';

const ContainerList = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const data = await containerApi.getContainers();
      setContainers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load containers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart', containerName: string) => {
    setActionLoading(containerName);
    try {
      switch (action) {
        case 'start':
          await containerApi.startContainer(containerName);
          break;
        case 'stop':
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

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="ark-slide-in">
          <h1 className="text-4xl font-bold text-primary mb-2">Server Management</h1>
          <p className="text-base-content/70">Control your ARK: Survival Ascended servers</p>
        </div>

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
                      className="ark-hover-scale transition-all duration-200"
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
                                {port}
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
                        <div className="flex items-center space-x-2">
                          {/* Action Buttons */}
                          {container.status === 'stopped' && (
                            <button
                              onClick={() => handleAction('start', container.name)}
                              disabled={actionLoading === container.name}
                              className="btn btn-sm btn-success ark-hover-glow"
                              title="Start Server"
                            >
                              {actionLoading === container.name ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                '▶️'
                              )}
                            </button>
                          )}
                          
                          {container.status === 'running' && (
                            <>
                              <button
                                onClick={() => handleAction('stop', container.name)}
                                disabled={actionLoading === container.name}
                                className="btn btn-sm btn-error ark-hover-glow"
                                title="Stop Server"
                              >
                                {actionLoading === container.name ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  '⏹️'
                                )}
                              </button>
                              <button
                                onClick={() => handleAction('restart', container.name)}
                                disabled={actionLoading === container.name}
                                className="btn btn-sm btn-warning ark-hover-glow"
                                title="Restart Server"
                              >
                                {actionLoading === container.name ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  '🔄'
                                )}
                              </button>
                            </>
                          )}

                          {/* Navigation Buttons */}
                          <Link
                            to={`/rcon/${container.name}`}
                            className="btn btn-sm btn-outline btn-primary ark-hover-glow"
                            title="RCON Console"
                          >
                            💬
                          </Link>
                          <Link
                            to={`/logs/${container.name}`}
                            className="btn btn-sm btn-outline btn-info ark-hover-glow"
                            title="View Logs"
                          >
                            📋
                          </Link>
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
      </div>
    </div>
  );
};

export default ContainerList; 