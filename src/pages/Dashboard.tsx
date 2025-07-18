import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import GlobalModManager from '../components/GlobalModManager';

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
  description: string;
  basePort: number;
  serverCount: number;
  created: string;
  servers: any[];
  path?: string;
  config?: any;
}

interface NativeServer {
  name: string;
  status: string;
  image: string;
  created: string;
  type: string;
  clusterName?: string;
  map?: string;
  gamePort?: number;
  queryPort?: number;
  rconPort?: number;
  maxPlayers?: number;
  serverPath?: string;
  config?: any;
  isClusterServer?: boolean;
  disableBattleEye?: boolean;
  password?: string;
  adminPassword?: string;
  clusterId?: string;
  clusterPassword?: string;
  clusterOwner?: string;
  gameUserSettings?: any;
  gameIni?: any;
  modManagement?: any;
}

interface DashboardStats {
  totalServers: number;
  runningServers: number;
  stoppedServers: number;
  totalPlayers: number;
  totalClusters: number;
}

interface DebugInfo {
  timestamp: string;
  environment: any;
  config: any;
  provisioner: any;
  clusters: any[];
  errors: string[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [nativeServers, setNativeServers] = useState<NativeServer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    runningServers: 0,
    stoppedServers: 0,
    totalPlayers: 0,
    totalClusters: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGlobalModManager, setShowGlobalModManager] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

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

      // Calculate stats
      const totalServers = nativeServersResponse.data.success ? nativeServersResponse.data.servers.length : 0;
      const runningServers = nativeServersResponse.data.success ? 
        nativeServersResponse.data.servers.filter((s: any) => s.status === 'running').length : 0;
      const stoppedServers = totalServers - runningServers;
      const totalClusters = clustersResponse.success ? clustersResponse.clusters.length : 0;

      setStats({
        totalServers,
        runningServers,
        stoppedServers,
        totalPlayers: 0, // We'll calculate this separately
        totalClusters
      });

    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDebugClick = async () => {
    try {
      setDebugLoading(true);
      const response = await api.get('/api/provisioning/debug');
      setDebugInfo(response.data);
      setShowDebugModal(true);
    } catch (error) {
      console.error('Failed to get debug info:', error);
      alert('Failed to get debug info. Check console for details.');
    } finally {
      setDebugLoading(false);
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
    
    if (usage.total && usage.used) {
      const gb = usage.used / 1024 / 1024 / 1024;
      return `${gb.toFixed(1)} GB`;
    }
    
    if (usage.heapUsed && typeof usage.heapUsed === 'number' && !isNaN(usage.heapUsed)) {
      const mb = usage.heapUsed / 1024 / 1024;
      return `${mb.toFixed(1)} MB (API)`;
    }
    
    return 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'text-success';
      case 'stopped': return 'text-error';
      case 'starting': return 'text-warning';
      case 'stopping': return 'text-info';
      default: return 'text-base-content/50';
    }
  };

  const getClusterStatus = (cluster: Cluster) => {
    // Handle both old and new cluster formats
    const servers = cluster.config?.servers || cluster.servers || [];
    if (servers.length > 0) {
      const running = servers.filter((s: any) => s.status === 'running').length;
      const stopped = servers.filter((s: any) => s.status === 'stopped').length;
      const total = servers.length;
      return `${total} servers (${running} running, ${stopped} stopped)`;
    }
    return 'No servers';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGlobalModManager(true)}
              className="btn btn-primary"
            >
              🔧 Global Mods
            </button>
            <button
              onClick={handleDebugClick}
              disabled={debugLoading}
              className="btn btn-outline btn-warning"
            >
              {debugLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                '🐛 Debug Info'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-content text-xl">🦖</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-base-content/70">Total Servers</p>
                  <p className="text-2xl font-bold text-base-content">{stats.totalServers}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                    <span className="text-success-content text-xl">🟢</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-base-content/70">Running</p>
                  <p className="text-2xl font-bold text-success">{stats.runningServers}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center">
                    <span className="text-error-content text-xl">🔴</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-base-content/70">Stopped</p>
                  <p className="text-2xl font-bold text-error">{stats.stoppedServers}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <span className="text-secondary-content text-xl">🏗️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-base-content/70">Clusters</p>
                  <p className="text-2xl font-bold text-base-content">{stats.totalClusters}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        {systemInfo && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-base-content mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <span className="text-accent-content text-sm font-medium">P</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-base-content/70">Platform</p>
                      <p className="text-lg font-semibold text-base-content">
                        {systemInfo.platform}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-base-content mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => navigate('/servers')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-2xl mb-2">🦖</div>
                <h3 className="font-semibold text-sm">Manage Servers</h3>
                <p className="text-xs text-base-content/70">View and control all servers</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/provisioning')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-2xl mb-2">🏗️</div>
                <h3 className="font-semibold text-sm">Create Server</h3>
                <p className="text-xs text-base-content/70">Set up new servers and clusters</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/global-configs')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-semibold text-sm">Global Settings</h3>
                <p className="text-xs text-base-content/70">Configure Game.ini files</p>
              </div>
            </button>

            <button
              onClick={() => setShowGlobalModManager(true)}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-2xl mb-2">🧩</div>
                <h3 className="font-semibold text-sm">Global Mods</h3>
                <p className="text-xs text-base-content/70">Add or remove mods</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/discord')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body p-4 text-center">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold text-sm">Discord Setup</h3>
                <p className="text-xs text-base-content/70">Configure notifications</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Clusters Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Clusters ({clusters.length})</h3>
            {clusters.length === 0 ? (
              <p className="text-gray-500">No clusters found</p>
            ) : (
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <div key={cluster.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{cluster.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getClusterStatus(cluster)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/clusters/${encodeURIComponent(cluster.name)}`)}
                      className="btn btn-sm btn-outline"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Servers */}
          {nativeServers.length > 0 && (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">Recent Servers</h2>
                  <button
                    onClick={() => navigate('/servers')}
                    className="btn btn-primary btn-sm"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3">
                  {nativeServers.slice(0, 3).map((server) => (
                    <div key={server.name} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                          <span className="text-secondary-content text-sm">🖥️</span>
                        </div>
                        <div>
                          <h3 className="font-medium">{server.name}</h3>
                          <p className={`text-sm ${getStatusColor(server.status)}`}>
                            {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/servers/${server.name}`)}
                        className="btn btn-ghost btn-xs"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {clusters.length === 0 && nativeServers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🦖</div>
            <h2 className="text-2xl font-bold text-base-content mb-2">Welcome to ASA Management Suite</h2>
            <p className="text-base-content/70 mb-6">
              Get started by creating your first ARK server or cluster
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/provisioning')}
                className="btn btn-primary"
              >
                Create Server
              </button>
              <button
                onClick={() => navigate('/servers')}
                className="btn btn-outline"
              >
                View Servers
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Debug Modal */}
      {showDebugModal && debugInfo && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl max-h-[90vh]">
            <h3 className="font-bold text-lg mb-4">Debug Information</h3>
            <div className="space-y-4 max-h-[70vh] overflow-auto">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Timestamp</h4>
                <p className="text-sm">{debugInfo.timestamp}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Environment Variables</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.environment, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Config</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.config, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Provisioner Paths</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.provisioner, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Clusters ({debugInfo.clusters.length})</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.clusters, null, 2)}
                </pre>
              </div>
              
              {debugInfo.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-red-600 mb-2">Errors ({debugInfo.errors.length})</h4>
                  <ul className="text-xs text-red-600">
                    {debugInfo.errors.map((error, index) => (
                      <li key={index} className="mb-1">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowDebugModal(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Mod Manager Modal */}
      {showGlobalModManager && (
        <GlobalModManager onClose={() => setShowGlobalModManager(false)} />
      )}
    </div>
  );
};

export default Dashboard;