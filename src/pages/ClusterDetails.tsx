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

type ClusterBackup = {
  clusterName: string;
  backupName: string;
  created: string;
  backupPath: string;
  size: number;
  type: string;
  hasMetadata: boolean;
};

type ServerBackup = {
  serverName: string;
  backupName: string;
  created: string;
  backupPath: string;
  size: number;
  type: string;
  hasMetadata: boolean;
};

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
  const [backups, setBackups] = useState<ClusterBackup[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [downloadBackupLoading, setDownloadBackupLoading] = useState<string | null>(null);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const [serverBackups, setServerBackups] = useState<Record<string, ServerBackup[]>>({});
  const [serverBackupLoading, setServerBackupLoading] = useState<Record<string, boolean>>({});
  const [serverBackupError, setServerBackupError] = useState<Record<string, string>>({});
  const [downloadServerBackupLoading, setDownloadServerBackupLoading] = useState<Record<string, boolean>>({});
  const [showServerBackupModal, setShowServerBackupModal] = useState<string | null>(null);
  const [showServerRestoreModal, setShowServerRestoreModal] = useState<string | null>(null);
  const [serverRestoreFile, setServerRestoreFile] = useState<Record<string, File | null>>({});
  const [serverRestoreLoading, setServerRestoreLoading] = useState<Record<string, boolean>>({});
  const [serverRestoreError, setServerRestoreError] = useState<Record<string, string>>({});
  const [serverRestoreSuccess, setServerRestoreSuccess] = useState<Record<string, string>>({});

  const [showBackupOptionsModal, setShowBackupOptionsModal] = useState(false);
  const [showRestoreOptionsModal, setShowRestoreOptionsModal] = useState(false);
  const [backupOptions, setBackupOptions] = useState({ saves: true, configs: true, logs: true });
  const [restoreOptions, setRestoreOptions] = useState({ saves: true, configs: true, logs: true });

  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

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
      } catch (err: unknown) {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action} cluster`);
    } finally {
      setActionLoading(null);
    }
  };

  // Download cluster config handler
  const handleDownloadConfig = async () => {
    if (!cluster) return;
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
    } catch {
      setDownloadError('Failed to download config');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download backup modal handler
  const openBackupModal = async () => {
    if (!cluster) return;
    setShowBackupModal(true);
    setBackupLoading(true);
    setBackupError(null);
    try {
      const result: unknown = await provisioningApi.getClusterBackups(cluster.name);
      if (typeof result === 'object' && result && (result as { success: boolean }).success) {
        setBackups((result as { backups: ClusterBackup[] }).backups || []);
      } else if (typeof result === 'object' && result) {
        setBackupError((result as { message?: string }).message || 'Failed to load backups');
      } else {
        setBackupError('Failed to load backups');
      }
    } catch {
      setBackupError('Failed to load backups');
    } finally {
      setBackupLoading(false);
    }
  };
  const handleDownloadBackup = async (backupName: string) => {
    if (!cluster) return;
    setDownloadBackupLoading(backupName);
    try {
      const blob = await provisioningApi.downloadClusterBackup(cluster.name, backupName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupName}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setDownloadNotification('Download started. Your browser may prompt you to choose a location.');
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
      setTimeout(() => setDownloadNotification(null), 4000);
    } catch {
      alert('Failed to download backup');
    } finally {
      setDownloadBackupLoading('');
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
    if (!restoreFile || !cluster) {
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
    } catch {
      setRestoreError('Failed to restore cluster');
    } finally {
      setRestoreLoading(false);
    }
  };

  // Server backup modal handlers
  const openServerBackupModal = async (serverName: string) => {
    setShowServerBackupModal(serverName);
    setServerBackupLoading(prev => ({ ...prev, [serverName]: true }));
    setServerBackupError(prev => ({ ...prev, [serverName]: '' }));
    try {
      const result: unknown = await provisioningApi.listServerBackups();
      if (typeof result === 'object' && result && (result as { success: boolean }).success) {
        const serverBackups = ((result as { data?: { backups?: ServerBackup[] } }).data?.backups || []).filter((b: ServerBackup) => b.serverName === serverName);
        setServerBackups(prev => ({ ...prev, [serverName]: serverBackups }));
      } else if (typeof result === 'object' && result) {
        setServerBackupError(prev => ({ ...prev, [serverName]: (result as { message?: string }).message || 'Failed to load backups' }));
      } else {
        setServerBackupError(prev => ({ ...prev, [serverName]: 'Failed to load backups' }));
      }
    } catch {
      setServerBackupError(prev => ({ ...prev, [serverName]: 'Failed to load backups' }));
    } finally {
      setServerBackupLoading(prev => ({ ...prev, [serverName]: false }));
    }
  };
  const handleDownloadServerBackup = async (serverName: string, backupName: string) => {
    setDownloadServerBackupLoading(prev => ({ ...prev, [backupName]: true }));
    try {
      const blob = await provisioningApi.downloadServerBackup(serverName, backupName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download server backup');
    } finally {
      setDownloadServerBackupLoading(prev => ({ ...prev, [backupName]: false }));
    }
  };

  // Server restore modal handlers
  const openServerRestoreModal = (serverName: string) => {
    setShowServerRestoreModal(serverName);
    setServerRestoreFile(prev => ({ ...prev, [serverName]: null }));
    setServerRestoreError(prev => ({ ...prev, [serverName]: '' }));
    setServerRestoreSuccess(prev => ({ ...prev, [serverName]: '' }));
  };
  const handleServerRestoreFileChange = (serverName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setServerRestoreFile(prev => ({ ...prev, [serverName]: e.target.files?.[0] || null }));
    setServerRestoreError(prev => ({ ...prev, [serverName]: '' }));
    setServerRestoreSuccess(prev => ({ ...prev, [serverName]: '' }));
  };
  const handleServerRestoreSubmit = async (serverName: string, e: React.FormEvent) => {
    e.preventDefault();
    const file = serverRestoreFile[serverName];
    if (!file) {
      setServerRestoreError(prev => ({ ...prev, [serverName]: 'Please select a backup ZIP file' }));
      return;
    }
    setServerRestoreLoading(prev => ({ ...prev, [serverName]: true }));
    setServerRestoreError(prev => ({ ...prev, [serverName]: '' }));
    setServerRestoreSuccess(prev => ({ ...prev, [serverName]: '' }));
    try {
      const result = await provisioningApi.restoreServerBackup(file, serverName);
      if (result.success) {
        setServerRestoreSuccess(prev => ({ ...prev, [serverName]: result.message || 'Server restored successfully' }));
      } else {
        setServerRestoreError(prev => ({ ...prev, [serverName]: result.message || 'Failed to restore server' }));
      }
    } catch {
      setServerRestoreError(prev => ({ ...prev, [serverName]: 'Failed to restore server' }));
    } finally {
      setServerRestoreLoading(prev => ({ ...prev, [serverName]: false }));
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
                            {cluster.config?.servers?.filter((s: { status: string }) => s.status === 'running').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Stopped:</span>
                          <span className="text-error">
                            {cluster.config?.servers?.filter((s: { status: string }) => s.status === 'stopped').length || 0}
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
                        title="Start all servers in this cluster."
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
                        title="Stop all servers in this cluster."
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
                        title="Restart all servers in this cluster."
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
                        title="Download the cluster configuration as a JSON file."
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
                        title="Download a previously created backup archive (ZIP) for this cluster."
                      >
                        🗄️ Download Backup
                      </button>
                      <button
                        onClick={openRestoreModal}
                        className="btn btn-outline btn-warning"
                        title="Restore the entire cluster from a previously created backup archive (ZIP)."
                      >
                        ♻️ Restore from Backup
                      </button>
                    </div>
                    <span className="text-xs text-base-content/60 block mt-1">
                      <b>Restore from Backup:</b> Restore the entire cluster from a previously created backup archive (ZIP).<br />
                      <b>Restore Cluster Data:</b> Restore specific data types (saves, configs, logs) for this cluster. You can select which data to restore.
                    </span>
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
                <div className="flex gap-2 mb-4">
                  <button className="btn btn-info" onClick={() => setShowBackupOptionsModal(true)}>
                    Backup Cluster Data
                  </button>
                  <button className="btn btn-warning" onClick={() => setShowRestoreOptionsModal(true)}>
                    Restore Cluster Data
                  </button>
                </div>
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
                    {cluster.config.servers.map((server: { name: string, status: string, map: string, gamePort: number, queryPort: number, rconPort: number }) => (
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
                            <button
                              onClick={() => openServerBackupModal(server.name)}
                              className="btn btn-outline btn-secondary btn-sm"
                            >
                              🗄️ Backup
                            </button>
                            <button
                              onClick={() => openServerRestoreModal(server.name)}
                              className="btn btn-outline btn-warning btn-sm"
                            >
                              ♻️ Restore
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
                {backups.map((b) => (
                  <li key={b.backupName} className="flex items-center justify-between bg-base-200 rounded p-3">
                    <div>
                      <div className="font-mono text-sm">{b.backupName}</div>
                      <div className="text-xs text-base-content/70">{b.created ? new Date(b.created).toLocaleString() : ''}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={downloadBackupLoading === b.backupName}
                      onClick={() => handleDownloadBackup(b.backupName)}
                    >
                      {downloadBackupLoading === b.backupName ? (
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
            <p className="text-xs text-base-content/60 mb-2">Restore the entire cluster from a previously created backup archive (ZIP). This will overwrite all current data with the contents of the backup.</p>
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
      {/* Server Backup Modal */}
      {showServerBackupModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Available Backups for {showServerBackupModal}</h3>
            {serverBackupLoading[showServerBackupModal] ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : serverBackupError[showServerBackupModal] ? (
              <div className="alert alert-error mb-4">{serverBackupError[showServerBackupModal]}</div>
            ) : serverBackups[showServerBackupModal]?.length === 0 ? (
              <div className="text-base-content/70">No backups found for this server.</div>
            ) : (
              <ul className="space-y-3">
                {serverBackups[showServerBackupModal]?.map((b: ServerBackup) => (
                  <li key={b.backupName} className="flex items-center justify-between bg-base-200 rounded p-3">
                    <div>
                      <div className="font-mono text-sm">{b.backupName}</div>
                      <div className="text-xs text-base-content/70">{b.created ? new Date(b.created).toLocaleString() : ''}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={downloadServerBackupLoading[b.backupName]}
                      onClick={() => handleDownloadServerBackup(showServerBackupModal, b.backupName)}
                    >
                      {downloadServerBackupLoading[b.backupName] ? (
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
              <button className="btn" onClick={() => setShowServerBackupModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Server Restore Modal */}
      {showServerRestoreModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Restore Server Saves</h3>
            <form onSubmit={(e) => handleServerRestoreSubmit(showServerRestoreModal, e)} className="space-y-4">
              <div>
                <label className="label">Target Server</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={showServerRestoreModal}
                  disabled
                />
              </div>
              <div>
                <label className="label">Backup ZIP File</label>
                <input
                  type="file"
                  accept=".zip"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => handleServerRestoreFileChange(showServerRestoreModal, e)}
                  disabled={serverRestoreLoading[showServerRestoreModal]}
                />
              </div>
              {serverRestoreError[showServerRestoreModal] && <div className="alert alert-error">{serverRestoreError[showServerRestoreModal]}</div>}
              {serverRestoreSuccess[showServerRestoreModal] && <div className="alert alert-success">{serverRestoreSuccess[showServerRestoreModal]}</div>}
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowServerRestoreModal(null)} disabled={serverRestoreLoading[showServerRestoreModal]}>Cancel</button>
                <button type="submit" className="btn btn-warning" disabled={serverRestoreLoading[showServerRestoreModal]}>
                  {serverRestoreLoading[showServerRestoreModal] ? <span className="loading loading-spinner loading-xs"></span> : '♻️ Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Backup Options Modal */}
      {showBackupOptionsModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Backup Cluster Data</h3>
            <form>
              <label className="flex items-center mb-2">
                <input type="checkbox" checked={backupOptions.saves} onChange={e => setBackupOptions(o => ({ ...o, saves: e.target.checked }))} />
                <span className="ml-2">Saves</span>
              </label>
              <label className="flex items-center mb-2">
                <input type="checkbox" checked={backupOptions.configs} onChange={e => setBackupOptions(o => ({ ...o, configs: e.target.checked }))} />
                <span className="ml-2">Configs</span>
              </label>
              <label className="flex items-center mb-2">
                <input type="checkbox" checked={backupOptions.logs} onChange={e => setBackupOptions(o => ({ ...o, logs: e.target.checked }))} />
                <span className="ml-2">Logs</span>
              </label>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-primary" onClick={async () => {
  if (!cluster) return;
  setDownloadLoading(true);
  setDownloadError(null);
  try {
    const response = await provisioningApi.backupCluster(cluster.name, {
      saves: backupOptions.saves,
      configs: backupOptions.configs,
      logs: backupOptions.logs
    });
    if (response.success) {
      // Optionally show a toast or success message
    } else {
      setDownloadError(response.message || 'Backup failed');
    }
  } catch (err: unknown) {
    setDownloadError(err instanceof Error ? err.message : 'Backup failed');
  } finally {
    setDownloadLoading(false);
    setShowBackupOptionsModal(false);
  }
}}>
                  Start Backup
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowBackupOptionsModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Options Modal */}
      {showRestoreOptionsModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Restore Cluster Data</h3>
            <p className="text-xs text-base-content/60 mb-2">Restore specific data types (saves, configs, logs) for this cluster. You can select which data to restore. This will not affect other data types.</p>
            <form>
              <label className="flex items-center mb-2">
                <input type="checkbox" checked={restoreOptions.saves} onChange={e => setRestoreOptions(o => ({ ...o, saves: e.target.checked }))} />
                <span className="ml-2">Saves</span>
              </label>
              <label className="flex items-center mb-2">
                <input type="checkbox" checked={restoreOptions.configs} onChange={e => setRestoreOptions(o => ({ ...o, configs: e.target.checked }))} />
                <span className="ml-2">Configs</span>
              </label>
              <label className="flex items-center mb-2">
                <input type="checkbox" checked={restoreOptions.logs} onChange={e => setRestoreOptions(o => ({ ...o, logs: e.target.checked }))} />
                <span className="ml-2">Logs</span>
              </label>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-warning" onClick={async () => {
  if (!cluster) return;
  setRestoreLoading(true);
  setRestoreError(null);
  try {
    const response = await provisioningApi.restoreCluster(cluster.name, {
      saves: restoreOptions.saves,
      configs: restoreOptions.configs,
      logs: restoreOptions.logs
    });
    if (response.success) {
      // Optionally show a toast or success message
    } else {
      setRestoreError(response.message || 'Restore failed');
    }
  } catch (err: unknown) {
    setRestoreError(err instanceof Error ? err.message : 'Restore failed');
  } finally {
    setRestoreLoading(false);
    setShowRestoreOptionsModal(false);
  }
}}>
                  Start Restore
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowRestoreOptionsModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {downloadNotification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 alert alert-info shadow-lg z-50 max-w-md">
          <span>{downloadNotification}</span>
        </div>
      )}
    </div>
  );
};

export default ClusterDetails; 