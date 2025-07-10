import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfigEditor from '../components/ConfigEditor';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [systemResponse, clustersResponse] = await Promise.all([
        api.get('/api/system/info'),
        apiService.provisioning.listClusters()
      ]);

      if (systemResponse.data.success) {
        setSystemInfo(systemResponse.data.systemInfo);
      }

      if (clustersResponse.success) {
        setClusters(clustersResponse.clusters);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'badge-success';
      case 'stopped': return 'badge-error';
      case 'starting': return 'badge-warning';
      case 'stopping': return 'badge-info';
      default: return 'badge-neutral';
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
    const mb = usage.used / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
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
            </div>
            {systemInfo && !systemInfo.dockerEnabled && (
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
                <div key={cluster.name} className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="card-title text-base-content">{cluster.name}</h3>
                      <span className="text-sm text-base-content/70">
                        {cluster.servers ? cluster.servers.length : 0} servers
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-base-content/70">
                        <span className="font-medium">Path:</span> {cluster.path}
                      </div>
                      <div className="text-sm text-base-content/70">
                        <span className="font-medium">Status:</span>
                        <span className={`ml-1 badge ${getStatusColor(
                          cluster.servers && cluster.servers.some(s => s.status === 'running') ? 'running' : 'stopped'
                        )}`}>
                          {cluster.servers && cluster.servers.some(s => s.status === 'running') ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {cluster.config && cluster.config.description && (
                        <div className="text-sm text-base-content/70">
                          <span className="font-medium">Description:</span> {cluster.config.description}
                        </div>
                      )}
                      {cluster.created && (
                        <div className="text-sm text-base-content/70">
                          <span className="font-medium">Created:</span> {new Date(cluster.created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {showConfigEditor && (
          <ConfigEditor onClose={() => setShowConfigEditor(false)} />
        )}
        
      </div>
    </div>
  );
};

export default Dashboard; 