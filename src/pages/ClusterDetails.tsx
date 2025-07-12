import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { containerApi } from '../services/api';
import GlobalModManager from '../components/GlobalModManager';
import GlobalConfigManager from '../components/GlobalConfigManager';

interface Cluster {
  name: string;
  path: string;
  created?: string;
  config?: {
    description?: string;
    maps?: string[];
    clusterPassword?: string;
    customDynamicConfigUrl?: string;
  };
  servers?: Array<{
    name: string;
    status: string;
    map: string;
    port: number;
    queryPort: number;
    rconPort: number;
  }>;
}

const ClusterDetails: React.FC = () => {
  const { clusterName } = useParams<{ clusterName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'mods' | 'configs' | 'servers'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load cluster data
  useEffect(() => {
    const loadCluster = async () => {
      if (!clusterName) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get cluster information from the API
        const clusters = await containerApi.getNativeServers();
        const foundCluster = clusters.find(c => c.name === clusterName && c.type === 'cluster');
        
        if (foundCluster) {
          setCluster(foundCluster as any);
        } else {
          setError(`Cluster "${clusterName}" not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cluster data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCluster();
  }, [clusterName]);

  // Handle tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'mods', 'configs', 'servers'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'mods' | 'configs' | 'servers');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'overview' | 'mods' | 'configs' | 'servers') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'badge-success';
      case 'stopped': return 'badge-error';
      case 'restarting': return 'badge-warning';
      case 'starting': return 'badge-warning';
      case 'stopping': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const handleClusterAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!cluster) return;
    
    setActionLoading(action);
    
    try {
      let response;
      switch (action) {
        case 'start':
          response = await containerApi.startNativeServer(cluster.name);
          break;
        case 'stop':
          response = await containerApi.stopNativeServer(cluster.name);
          break;
        case 'restart':
          response = await containerApi.restartNativeServer(cluster.name);
          break;
      }
      
      if (response.success) {
        // Reload cluster data
        const clusters = await containerApi.getNativeServers();
        const updatedCluster = clusters.find(c => c.name === clusterName);
        if (updatedCluster) {
          setCluster(updatedCluster as any);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} cluster`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading cluster details...</p>
        </div>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error || 'Cluster not found'}</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary mt-4"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏗️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">{cluster.name}</h1>
                <p className="text-base-content/70">
                  Cluster Management - {cluster.servers?.length || 0} servers
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="btn btn-outline btn-primary hover:shadow-lg hover:shadow-primary/25"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${activeTab === 'mods' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('mods')}
          >
            🧩 Mods
          </button>
          <button
            className={`tab ${activeTab === 'configs' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('configs')}
          >
            ⚙️ Configs
          </button>
          <button
            className={`tab ${activeTab === 'servers' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('servers')}
          >
            🖥️ Servers
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-sm flex-1">
          <div className="card-body">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Cluster Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Cluster Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Name:</span>
                          <span className="font-medium">{cluster.name}</span>
                        </div>
                        {cluster.config?.description && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Description:</span>
                            <span className="font-medium">{cluster.config.description}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Created:</span>
                          <span>{cluster.created ? new Date(cluster.created).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Path:</span>
                          <div className="font-mono text-xs truncate max-w-48" title={cluster.path}>
                            {cluster.path}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Server Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Total Servers:</span>
                          <span>{cluster.servers?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Running:</span>
                          <span className="text-success">
                            {cluster.servers?.filter(s => s.status === 'running').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Stopped:</span>
                          <span className="text-error">
                            {cluster.servers?.filter(s => s.status === 'stopped').length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cluster Actions */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h4 className="card-title">Cluster Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleClusterAction('start')}
                        disabled={actionLoading === 'start'}
                        className="btn btn-success"
                      >
                        {actionLoading === 'start' ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          '▶️ Start All'
                        )}
                      </button>
                      <button
                        onClick={() => handleClusterAction('stop')}
                        disabled={actionLoading === 'stop'}
                        className="btn btn-error"
                      >
                        {actionLoading === 'stop' ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          '⏹️ Stop All'
                        )}
                      </button>
                      <button
                        onClick={() => handleClusterAction('restart')}
                        disabled={actionLoading === 'restart'}
                        className="btn btn-warning"
                      >
                        {actionLoading === 'restart' ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          '🔄 Restart All'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configuration Summary */}
                {cluster.config && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Configuration</h4>
                      <div className="space-y-2">
                        {cluster.config.maps && cluster.config.maps.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Maps:</span>
                            <span>{cluster.config.maps.join(', ')}</span>
                          </div>
                        )}
                        {cluster.config.clusterPassword && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Cluster Password:</span>
                            <span className="font-mono">••••••••</span>
                          </div>
                        )}
                        {cluster.config.customDynamicConfigUrl && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Custom Config URL:</span>
                            <span className="font-mono text-xs truncate max-w-64" title={cluster.config.customDynamicConfigUrl}>
                              {cluster.config.customDynamicConfigUrl}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mods' && (
              <GlobalModManager clusterName={cluster.name} onClose={() => handleTabChange('overview')} />
            )}

            {activeTab === 'configs' && (
              <GlobalConfigManager clusterName={cluster.name} />
            )}

            {activeTab === 'servers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">Cluster Servers</h2>
                  <span className="text-sm text-base-content/70">
                    {cluster.servers?.length || 0} servers
                  </span>
                </div>

                {cluster.servers && cluster.servers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cluster.servers.map((server) => (
                      <div key={server.name} className="card bg-base-200 hover:shadow-lg transition-shadow">
                        <div className="card-body">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="card-title text-lg">{server.name}</h3>
                            <span className={`badge ${getStatusColor(server.status)}`}>
                              {server.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-base-content/70">Map:</span>
                              <span>{server.map}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-base-content/70">Port:</span>
                              <span>{server.port}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-base-content/70">Query:</span>
                              <span>{server.queryPort}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-base-content/70">RCON:</span>
                              <span>{server.rconPort}</span>
                            </div>
                          </div>

                          <div className="card-actions justify-end mt-4">
                            <button
                              onClick={() => navigate(`/servers/${server.name}`)}
                              className="btn btn-primary btn-sm"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-base-content/50">
                    <div className="text-4xl mb-4">🖥️</div>
                    <p className="text-lg">No servers in this cluster</p>
                    <p className="text-sm">Servers will appear here once they are created</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetails; 