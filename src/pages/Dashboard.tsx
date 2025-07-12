import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfigEditor from '../components/ConfigEditor';
import GlobalModManager from '../components/GlobalModManager';
import ServerDetailsModal from '../components/ServerDetailsModal';
// import type { Server } from '../utils/serverUtils';

interface SystemInfo {
  mode: string;
  platform: string;
  nodeVersion: string;
  uptime: number;
  memoryUsage: any;
  dockerEnabled: boolean;
  powershellEnabled: boolean;
  nativeBasePath: string;
  nativeClustersPath: string;
}

interface Cluster {
  name: string;
  path: string;
  config: any;
  created: string;
  servers?: Server[]; // Make servers optional since it's not always present
}

interface Server {
  name: string;
  map: string;
  port: number;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  players: number;
  maxPlayers: number;
}

interface NativeServer {
  name: string;
  status: string;
  type: string;
  map?: string;
  clusterName?: string;
  gamePort?: number;
  maxPlayers?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [nativeServers, setNativeServers] = useState<NativeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showModManager, setShowModManager] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [systemResponse, clustersResponse, nativeServersResponse] = await Promise.all([
        api.get('/api/system/info'),
        apiService.provisioning.listClusters().catch(() => ({ success: false, clusters: [] })),
        api.get('/api/native-servers').catch(() => ({ data: { success: false, servers: [] } }))
      ]);

      if (systemResponse.data.success) {
        setSystemInfo(systemResponse.data.systemInfo);
      }

      if (clustersResponse.success) {
        setClusters(clustersResponse.clusters);
      }

      if (nativeServersResponse.data.success) {
        setNativeServers(nativeServersResponse.data.servers);
      }
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };



  const getModeDisplayName = (mode: string) => {
    switch (mode) {
      case 'docker': return 'Docker Mode';
      case 'native': return 'Native Windows Mode';
      case 'hybrid': return 'Hybrid Mode';
      default: return mode;
    }
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'docker':
        return 'Running in Docker containers with full isolation';
      case 'native':
        return 'Running directly on Windows with native performance';
      case 'hybrid':
        return 'Mixed Docker and native deployment';
      default:
        return 'Unknown deployment mode';
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'running': return 'badge-success';
  //     case 'stopped': return 'badge-error';
  //     case 'starting': return 'badge-warning';
  //     case 'stopping': return 'badge-info';
  //     default: return 'badge-neutral';
  //   }
  // };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemoryUsage = (usage: any) => {
    if (!usage) return 'N/A';
    
    // Handle system memory (has total, free, used properties)
    if (usage.total && usage.used) {
      const gb = usage.used / 1024 / 1024 / 1024;
      return `${gb.toFixed(1)} GB`;
    }
    
    // Handle API memory usage (has heapUsed property)
    if (usage.heapUsed && typeof usage.heapUsed === 'number' && !isNaN(usage.heapUsed)) {
      const mb = usage.heapUsed / 1024 / 1024;
      return `${mb.toFixed(1)} MB (API)`;
    }
    
    return 'N/A';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">ASA Management Dashboard</h1>
          <p className="mt-2 text-base-content/70">
            Manage your ARK: Survival Ascended servers and clusters
          </p>
        </div>

        {error && (
          <div className="mb-6 alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* System Information */}
        {systemInfo && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-content text-sm font-medium">M</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-base-content/70">Mode</p>
                    <p className="text-lg font-semibold text-base-content">
                      {getModeDisplayName(systemInfo.mode)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                      <span className="text-success-content text-sm font-medium">U</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-base-content/70">Uptime</p>
                    <p className="text-lg font-semibold text-base-content">
                      {formatUptime(systemInfo.uptime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                      <span className="text-secondary-content text-sm font-medium">M</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-base-content/70">Memory</p>
                    <p className="text-lg font-semibold text-base-content">
                      {formatMemoryUsage(systemInfo.memoryUsage)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                      <span className="text-accent-content text-sm font-medium">S</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-base-content/70">Servers</p>
                    <p className="text-lg font-semibold text-base-content">
                      <a href="/servers" className="link link-primary">
                        View All
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode Information */}
        {systemInfo && (
          <div className="mb-8 card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base-content">System Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-base-content/70 mb-2">Deployment Mode</h3>
                  <p className="text-sm text-base-content">{getModeDescription(systemInfo.mode)}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-base-content/50">
                    <span>Platform: {systemInfo.platform}</span>
                    <span>Node: {systemInfo.nodeVersion}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-base-content/70 mb-2">Features</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${systemInfo.dockerEnabled ? 'bg-success' : 'bg-base-300'}`}></span>
                      <span>Docker: {systemInfo.dockerEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${systemInfo.powershellEnabled ? 'bg-success' : 'bg-base-300'}`}></span>
                      <span>PowerShell: {systemInfo.powershellEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base-content">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/provisioning')}
                className="btn btn-primary"
              >
                Create New Cluster
              </button>
              <button
                onClick={() => navigate('/servers')}
                className="btn btn-secondary"
              >
                View All Servers
              </button>
              <button
                onClick={() => setShowConfigEditor(true)}
                className="btn btn-accent"
              >
                Edit Configuration
              </button>
              <button
                onClick={loadDashboardData}
                className="btn btn-success"
              >
                Refresh Data
              </button>
              <button
                onClick={() => setShowModManager(true)}
                className="btn btn-info"
              >
                Manage Mods
              </button>
            </div>
            {systemInfo && !systemInfo.dockerEnabled && clusters.length === 0 && systemInfo.mode === 'native' && (
              <div className="mt-4 alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  <strong>System Setup Required:</strong> Before creating clusters, you need to initialize the system and install SteamCMD. 
                  Go to the <button onClick={() => navigate('/provisioning')} className="link link-primary">Provisioning page</button> to set up your environment.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clusters */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-base-content">Clusters</h2>
            <span className="text-sm text-base-content/70">{clusters.length} clusters</span>
          </div>
          
          {clusters.length === 0 ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body text-center">
                <div className="text-base-content/30 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-base-content mb-2">No clusters found</h3>
                <p className="text-base-content/70 mb-4">
                  {systemInfo?.mode === 'native' 
                    ? 'Create your first cluster to get started with ASA server management.'
                    : 'No clusters are currently configured in your system.'
                  }
                </p>
                <button
                  onClick={() => navigate('/provisioning')}
                  className="btn btn-primary"
                >
                  Create First Cluster
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clusters.map((cluster) => (
                <div key={cluster.name} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 border border-base-300">
                  <div className="card-body">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="avatar placeholder">
                          <div className="bg-gradient-to-br from-primary to-accent text-primary-content rounded-full w-12">
                            <span className="text-lg">🦖</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="card-title text-base-content text-lg">{cluster.name}</h3>
                          <p className="text-sm text-base-content/60">
                            {cluster.servers ? cluster.servers.length : 0} servers
                          </p>
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a>View Details</a></li>
                          <li><a>Manage Servers</a></li>
                          <li><a>Edit Configuration</a></li>
                          <li><a className="text-error">Delete Cluster</a></li>
                        </ul>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`badge badge-lg ${
                        cluster.servers && cluster.servers.some(s => s.status === 'running') 
                          ? 'badge-success' 
                          : 'badge-error'
                      }`}>
                        {cluster.servers && cluster.servers.some(s => s.status === 'running') ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      {cluster.config && cluster.config.description && (
                        <div className="text-sm">
                          <p className="text-base-content/70">{cluster.config.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-base-content/60">Created:</span>
                          <div className="font-medium">
                            {cluster.created ? new Date(cluster.created).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <span className="text-base-content/60">Path:</span>
                          <div className="font-mono text-xs truncate" title={cluster.path}>
                            {cluster.path}
                          </div>
                        </div>
                      </div>

                      {/* Server Status Summary */}
                      {cluster.servers && cluster.servers.length > 0 && (
                        <div className="stats stats-horizontal shadow-sm">
                          <div className="stat">
                            <div className="stat-title text-xs">Running</div>
                            <div className="stat-value text-success text-lg">
                              {cluster.servers.filter(s => s.status === 'running').length}
                            </div>
                          </div>
                          <div className="stat">
                            <div className="stat-title text-xs">Stopped</div>
                            <div className="stat-value text-error text-lg">
                              {cluster.servers.filter(s => s.status === 'stopped').length}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="card-actions justify-end mt-4">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/clusters/${cluster.name}`)}
                      >
                        Manage
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate('/logs')}
                      >
                        View Logs
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {systemInfo && clusters.length === 0 && systemInfo.mode === 'native' && (
            <div className="mt-4 alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>
                <strong>No Clusters Found:</strong> You haven't created any clusters yet. 
                Go to the <button onClick={() => navigate('/provisioning')} className="link link-primary">Provisioning page</button> to create your first cluster.
              </span>
            </div>
          )}
        </div>

        {/* Servers */}
        {nativeServers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-base-content">Servers</h2>
              <span className="text-sm text-base-content/70">{nativeServers.length} servers</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nativeServers.map((server) => (
                <div key={server.name} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 border border-base-300">
                  <div className="card-body">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="avatar placeholder">
                          <div className="bg-gradient-to-br from-secondary to-accent text-secondary-content rounded-full w-12">
                            <span className="text-lg">🖥️</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="card-title text-base-content text-lg">{server.name}</h3>
                          <p className="text-sm text-base-content/60">
                            {server.type === 'cluster-server' ? 'Cluster Server' : 'Individual Server'}
                          </p>
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><button onClick={() => navigate(`/rcon/${server.name}`)}>RCON Console</button></li>
                          <li><button onClick={() => navigate(`/logs/${server.name}`)}>View Logs</button></li>
                          <li><button onClick={() => navigate(`/configs?server=${encodeURIComponent(server.name)}`)}>Edit Config</button></li>
                          <li><button className="text-error">Delete Server</button></li>
                        </ul>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`badge badge-lg ${
                        server.status === 'running' 
                          ? 'badge-success' 
                          : 'badge-error'
                      }`}>
                        {server.status === 'running' ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-base-content/60">Name:</span>
                          <div className="font-medium">{server.name}</div>
                        </div>
                        <div>
                          <span className="text-base-content/60">Type:</span>
                          <div className="font-medium">{server.type === 'cluster-server' ? 'Cluster Server' : 'Individual Server'}</div>
                        </div>
                        <div>
                          <span className="text-base-content/60">Status:</span>
                          <div className="font-medium">{server.status}</div>
                        </div>
                        <div>
                          <span className="text-base-content/60">Map:</span>
                          <div className="font-medium">{server.map || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-base-content/60">Players:</span>
                          <div className="font-medium">0/{server.maxPlayers || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="card-actions justify-end mt-4">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          // Convert NativeServer to Server format for the modal
                          const serverForModal: Server = {
                            name: server.name,
                            status: server.status as 'running' | 'stopped' | 'starting' | 'stopping',
                            map: server.map || '',
                            port: 0, // or a valid port if available
                            players: 0, // or a valid value if available
                            maxPlayers: server.maxPlayers || 0
                          };
                          setSelectedServer(serverForModal);
                        }}
                      >
                        Details
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/rcon/${server.name}`)}
                      >
                        RCON
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {nativeServers.length === 0 && (
          <div className="mt-4 alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>
              <strong>No Servers Found:</strong> You haven't created any servers yet. 
              Go to the <button onClick={() => navigate('/provisioning')} className="link link-primary">Provisioning page</button> to create your first server.
            </span>
          </div>
        )}

        {/* Modals */}
        {showConfigEditor && (
          <ConfigEditor onClose={() => setShowConfigEditor(false)} />
        )}
        {showModManager && (
          <GlobalModManager onClose={() => setShowModManager(false)} />
        )}
        {selectedServer && (
          <ServerDetailsModal
            server={selectedServer as any}
            isOpen={!!selectedServer}
            onClose={() => setSelectedServer(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;