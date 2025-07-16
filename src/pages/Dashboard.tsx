import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingState from '../components/LoadingState';

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
  servers?: Server[];
}

interface Server {
  name: string;
  map: string;
  gamePort: number;
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

interface DashboardStats {
  totalServers: number;
  runningServers: number;
  stoppedServers: number;
  totalPlayers: number;
  totalClusters: number;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/servers')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body text-center">
                <div className="text-3xl mb-2">🦖</div>
                <h3 className="font-semibold">Manage Servers</h3>
                <p className="text-sm text-base-content/70">View and control all servers</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/provisioning')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body text-center">
                <div className="text-3xl mb-2">🏗️</div>
                <h3 className="font-semibold">Create Server</h3>
                <p className="text-sm text-base-content/70">Set up new servers and clusters</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/global-configs')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body text-center">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-semibold">Global Server Settings</h3>
                <p className="text-sm text-base-content/70">Configure Game.ini and GameUserSettings.ini</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/discord')}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="card-body text-center">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="font-semibold">Discord Setup</h3>
                <p className="text-sm text-base-content/70">Configure notifications</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Clusters */}
          {clusters.length > 0 && (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">Recent Clusters</h2>
                  <button
                    onClick={() => navigate('/provisioning')}
                    className="btn btn-primary btn-sm"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3">
                  {clusters.slice(0, 3).map((cluster) => (
                    <div key={cluster.name} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                          <span className="text-primary-content text-sm">🦖</span>
                        </div>
                        <div>
                          <h3 className="font-medium">{cluster.name}</h3>
                          <p className="text-sm text-base-content/70">
                            {cluster.servers ? cluster.servers.length : 0} servers
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/clusters/${cluster.name}`)}
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
    </div>
  );
};

export default Dashboard;