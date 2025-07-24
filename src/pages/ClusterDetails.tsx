import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { provisioningApi } from '../services/api';
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
    servers?: Array<{
      name: string;
      status: string;
      map: string;
      gamePort: number;
      queryPort: number;
      rconPort: number;
    }>;
  };
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
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [downloadBackupLoading, setDownloadBackupLoading] = useState<string | null>(null);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Load cluster data
  useEffect(() => {
    const loadCluster = async () => {
      if (!clusterName) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get cluster information from the API
        const response = await provisioningApi.getClusterDetails(clusterName);
        
        if (response.success && response.cluster) {
          setCluster(response.cluster);
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
          response = await provisioningApi.startCluster(cluster.name);
          break;
        case 'stop':
          response = await provisioningApi.stopCluster(cluster.name);
          break;
        case 'restart':
          response = await provisioningApi.restartCluster(cluster.name);
          break;
      }
      
      if (response.success) {
        // Reload cluster data
        if (clusterName) {
          const clusterResponse = await provisioningApi.getClusterDetails(clusterName);
          if (clusterResponse.success && clusterResponse.cluster) {
            setCluster(clusterResponse.cluster);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} cluster`);
    } finally {
      setActionLoading(null);
    }
  };

  // Download cluster config handler
  const handleDownloadConfig = async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const blob = await provisioningApi.exportClusterConfig(cluster.name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cluster.name}-cluster.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download config');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download backup modal handler
  const openBackupModal = async () => {
    setShowBackupModal(true);
    setBackupLoading(true);
    setBackupError(null);
    try {
      const result = await provisioningApi.listClusterBackups(cluster.name);
      if (result.success) {
        setBackups(result.backups || []);
      } else {
        setBackupError(result.message || 'Failed to load backups');
      }
    } catch (err: any) {
      setBackupError(err.message || 'Failed to load backups');
    } finally {
      setBackupLoading(false);
    }
  };
  const handleDownloadBackup = async (backupName: string) => {
    setDownloadBackupLoading(backupName);
    try {
      const blob = await provisioningApi.downloadClusterBackup(cluster.name, backupName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download backup');
    } finally {
      setDownloadBackupLoading(null);
    }
  };

  // Restore from backup modal handler
  const openRestoreModal = () => {
    setShowRestoreModal(true);
    setRestoreFile(null);
    setRestoreError(null);
    setRestoreSuccess(null);
  };
  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreFile(e.target.files?.[0] || null);
    setRestoreError(null);
    setRestoreSuccess(null);
  };
  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      setRestoreError('Please select a backup ZIP file');
      return;
    }
    setRestoreLoading(true);
    setRestoreError(null);
    setRestoreSuccess(null);
    try {
      const result = await provisioningApi.restoreClusterBackup(restoreFile, cluster.name);
      if (result.success) {
        setRestoreSuccess(result.message || 'Cluster restored successfully');
      } else {
        setRestoreError(result.message || 'Failed to restore cluster');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore cluster');
    } finally {
      setRestoreLoading(false);
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
                  Cluster Management - {cluster.config?.servers?.length || 0} servers
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
                          <span>{cluster.config?.servers?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Running:</span>
                          <span className="text-success">
                            {cluster.config?.servers?.filter((s: any) => s.status === 'running').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Stopped:</span>
                          <span className="text-error">
                            {cluster.config?.servers?.filter((s: any) => s.status === 'stopped').length || 0}
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
                      <button
                        onClick={handleDownloadConfig}
                        disabled={downloadLoading}
                        className="btn btn-outline btn-info"
                      >
                        {downloadLoading ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          '⬇️ Download Config'
                        )}
                      </button>
                      <button
                        onClick={openBackupModal}
                        className="btn btn-outline btn-secondary"
                      >
                        🗄️ Download Backup
                      </button>
                      <button
                        onClick={openRestoreModal}
                        className="btn btn-outline btn-warning"
                      >
                        ♻️ Restore from Backup
                      </button>
                    </div>
                    {downloadError && (
                      <div className="alert alert-error mt-2">
                        <span>{downloadError}</span>
                      </div>
                    )}
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
                    {cluster.config?.servers?.length || 0} servers
                  </span>
                </div>

                {cluster.config?.servers && cluster.config.servers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cluster.config.servers.map((server: any) => (
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
                              <span>{server.gamePort}</span>
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
      {/* Backup Modal */}
      {showBackupModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Available Backups</h3>
            {backupLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : backupError ? (
              <div className="alert alert-error mb-4">{backupError}</div>
            ) : backups.length === 0 ? (
              <div className="text-base-content/70">No backups found for this cluster.</div>
            ) : (
              <ul className="space-y-3">
                {backups.map((b: any) => (
                  <li key={b.name} className="flex items-center justify-between bg-base-200 rounded p-3">
                    <div>
                      <div className="font-mono text-sm">{b.name}</div>
                      <div className="text-xs text-base-content/70">{b.backupDate ? new Date(b.backupDate).toLocaleString() : ''}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={downloadBackupLoading === b.name}
                      onClick={() => handleDownloadBackup(b.name)}
                    >
                      {downloadBackupLoading === b.name ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        '⬇️ Download ZIP'
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-action">
              <button className="btn" onClick={() => setShowBackupModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Restore from Backup</h3>
            <form onSubmit={handleRestoreSubmit} className="space-y-4">
              <div>
                <label className="label">Target Cluster Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={cluster.name}
                  disabled
                />
              </div>
              <div>
                <label className="label">Backup ZIP File</label>
                <input
                  type="file"
                  accept=".zip"
                  className="file-input file-input-bordered w-full"
                  onChange={handleRestoreFileChange}
                  disabled={restoreLoading}
                />
              </div>
              {restoreError && <div className="alert alert-error">{restoreError}</div>}
              {restoreSuccess && <div className="alert alert-success">{restoreSuccess}</div>}
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowRestoreModal(false)} disabled={restoreLoading}>Cancel</button>
                <button type="submit" className="btn btn-warning" disabled={restoreLoading}>
                  {restoreLoading ? <span className="loading loading-spinner loading-xs"></span> : '♻️ Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterDetails; 