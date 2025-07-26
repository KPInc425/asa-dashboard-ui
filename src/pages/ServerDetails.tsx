import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Server } from '../utils/serverUtils';
import { containerApi, provisioningApi } from '../services';
import ServerModManager from '../components/ServerModManager';
import ServerConfigEditor from '../components/ServerConfigEditor';
import ServerLogViewer from '../components/ServerLogViewer';
import StartScriptViewer from '../components/StartScriptViewer';
import ServerUpdateManager from '../components/ServerUpdateManager';
import ServerSettingsEditor from '../components/ServerSettingsEditor';
import ServerLiveDetails from '../components/ServerLiveDetails';
import SaveFileManager from '../components/SaveFileManager';
import ServerDetailsRconConsole from '../components/ServerDetailsRconConsole';

const ServerDetails: React.FC = () => {
  const { serverName } = useParams<{ serverName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves'>('details');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStartScript, setShowStartScript] = useState(false);
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  const [configSectionExpanded, setConfigSectionExpanded] = useState(false);

  // Backup/Restore state
  const [serverBackups, setServerBackups] = useState<Array<{ name: string; backupDate?: string; serverName: string }>>([]);
  const [serverBackupLoading, setServerBackupLoading] = useState(false);
  const [serverBackupError, setServerBackupError] = useState<string>('');
  const [downloadServerBackupLoading, setDownloadServerBackupLoading] = useState<string>('');
  const [showServerBackupModal, setShowServerBackupModal] = useState(false);
  const [showServerRestoreModal, setShowServerRestoreModal] = useState(false);
  const [serverRestoreFile, setServerRestoreFile] = useState<File | null>(null);
  const [serverRestoreLoading, setServerRestoreLoading] = useState(false);
  const [serverRestoreError, setServerRestoreError] = useState<string>('');
  const [serverRestoreSuccess, setServerRestoreSuccess] = useState<string>('');

  // Load server data
  useEffect(() => {
    const loadServer = async () => {
      if (!serverName) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to get server from both containers and native servers
        let serverData: Server | null = null;
        
        try {
          const containers = await containerApi.getContainers();
          const foundContainer = containers.find(c => c.name === serverName);
          if (foundContainer) {
            serverData = foundContainer as Server;
          }
        } catch (error) {
          console.log(`Error getting containers for ${serverName}:`, error);
        }
        
        if (!serverData) {
          try {
            const nativeServers = await containerApi.getNativeServers();
            const foundNativeServer = nativeServers.find(s => s.name === serverName);
            if (foundNativeServer) {
              serverData = foundNativeServer as Server;
            }
          } catch (error) {
            console.log(`Error getting native servers for ${serverName}:`, error);
          }
        }
        
        if (serverData) {
          setServer(serverData);
        } else {
          setError(`Server "${serverName}" not found`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load server data');
      } finally {
        setLoading(false);
      }
    };
    
    loadServer();
  }, [serverName]);

  // Handle tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['details', 'rcon', 'config', 'logs', 'mods', 'saves'].includes(tabParam)) {
      setActiveTab(tabParam as 'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves');
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getMapDisplayName = (mapCode: string): string => {
    const mapNames: Record<string, string> = {
      'TheIsland_WP': 'The Island',
      'TheCenter_WP': 'The Center',
      'Ragnarok_WP': 'Ragnarok',
      'ScorchedEarth_WP': 'Scorched Earth',
      'Aberration_WP': 'Aberration',
      'Extinction_WP': 'Extinction',
      'BobsMissions_WP': 'Club ARK',
      'CrystalIsles_WP': 'Crystal Isles',
      'Valguero_WP': 'Valguero',
      'LostIsland_WP': 'Lost Island',
      'Fjordur_WP': 'Fjordur',
      'Genesis_WP': 'Genesis',
      'Genesis2_WP': 'Genesis Part 2',
      'TheIsland': 'The Island',
      'TheCenter': 'The Center',
      'Ragnarok': 'Ragnarok',
      'ScorchedEarth': 'Scorched Earth',
      'Aberration': 'Aberration',
      'Extinction': 'Extinction',
      'BobsMissions': 'Club ARK',
      'CrystalIsles': 'Crystal Isles',
      'Valguero': 'Valguero',
      'LostIsland': 'Lost Island',
      'Fjordur': 'Fjordur',
      'Genesis': 'Genesis',
      'Genesis2': 'Genesis Part 2'
    };
    
    return mapNames[mapCode] || mapCode;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'container': return 'Container';
      case 'native': return 'Native';
      case 'cluster': return 'Cluster';
      case 'cluster-server': return 'Cluster Server';
      case 'individual': return 'Individual Server';
      default: return type;
    }
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

  // Server control actions
  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!server) return;
    
    setActionLoading(action);
    
    try {
      let response;
      
      if (server.type === 'container') {
        // Use container API methods
        switch (action) {
          case 'start':
            response = await containerApi.startContainer(server.name);
            break;
          case 'stop':
            response = await containerApi.stopContainer(server.name);
            break;
          case 'restart':
            response = await containerApi.restartContainer(server.name);
            break;
        }
      } else {
        // Use native server API methods
        switch (action) {
          case 'start':
            response = await containerApi.startNativeServer(server.name);
            break;
          case 'stop':
            response = await containerApi.stopNativeServer(server.name);
            break;
          case 'restart':
            response = await containerApi.restartNativeServer(server.name);
            break;
        }
      }
      
      if (response.success) {
        // For start actions, check if server is actually running after a delay
        if (action === 'start' && server.type !== 'container') {
          // Show immediate success message
          console.log(response.message);
          
          // Check server status after a delay
          setTimeout(async () => {
            try {
              const isRunning = await containerApi.isNativeServerRunning(server.name);
              if (isRunning) {
                console.log(`Server ${server.name} is now running`);
              } else {
                console.log(`Server ${server.name} may still be starting up`);
              }
              // Reload server data to update status
              window.location.reload();
            } catch (error) {
              console.error('Error checking server status:', error);
            }
          }, 5000); // Check after 5 seconds
        } else {
          // For other actions, reload immediately
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        setError(`Failed to ${action} server: ${response.message || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      console.error(`Failed to ${action} server:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to ${action} server: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Server backup modal handlers
  const openServerBackupModal = async () => {
    if (!serverName) return;
    setShowServerBackupModal(true);
    setServerBackupLoading(true);
    setServerBackupError('');
    try {
      const result = await provisioningApi.listServerBackups();
      if (result.success) {
        const serverBackups = (result.data?.backups || []).filter((b: { serverName: string }) => b.serverName === serverName);
        setServerBackups(serverBackups);
      } else {
        setServerBackupError(result.message || 'Failed to load backups');
      }
    } catch (err: unknown) {
      setServerBackupError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setServerBackupLoading(false);
    }
  };

  const handleDownloadServerBackup = async (backupName: string) => {
    if (!serverName) return;
    setDownloadServerBackupLoading(backupName);
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
    } catch (err: unknown) {
      console.error('Failed to download server backup:', err);
      alert('Failed to download server backup');
    } finally {
      setDownloadServerBackupLoading('');
    }
  };

  const handleDeleteServerBackup = async (backupName: string) => {
    if (!serverName || !window.confirm(`Are you sure you want to delete backup "${backupName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await provisioningApi.deleteServerBackup(serverName, backupName);
      if (response.success) {
        // Remove from local state
        setServerBackups(prev => prev.filter(b => b.name !== backupName));
      } else {
        alert(`Failed to delete backup: ${response.message}`);
      }
    } catch (err: unknown) {
      console.error('Failed to delete backup:', err);
      alert('Failed to delete backup');
    }
  };

  // Server restore modal handlers
  const openServerRestoreModal = () => {
    setShowServerRestoreModal(true);
    setServerRestoreFile(null);
    setServerRestoreError('');
    setServerRestoreSuccess('');
  };

  const handleServerRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerRestoreFile(e.target.files?.[0] || null);
    setServerRestoreError('');
    setServerRestoreSuccess('');
  };

  const handleServerRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName || !serverRestoreFile) {
      setServerRestoreError('Please select a backup ZIP file');
      return;
    }
    setServerRestoreLoading(true);
    setServerRestoreError('');
    setServerRestoreSuccess('');
    try {
      const result = await provisioningApi.restoreServerBackup(serverRestoreFile, serverName);
      if (result.success) {
        setServerRestoreSuccess(result.message || 'Server restored successfully');
      } else {
        setServerRestoreError(result.message || 'Failed to restore server');
      }
    } catch (err: unknown) {
      setServerRestoreError(err instanceof Error ? err.message : 'Failed to restore server');
    } finally {
      setServerRestoreLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading server details...</p>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error || 'Server not found'}</span>
          </div>
          <button onClick={() => navigate('/servers')} className="btn btn-primary">
            ← Back to Servers
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
              <button 
                onClick={() => navigate('/servers')}
                className="btn btn-ghost btn-circle"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-2xl">🦖</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-primary mb-1 truncate">{server.name}</h1>
                <p className="text-sm text-base-content/70 truncate">
                  Server Management & Configuration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className={`badge ${getStatusColor(server.status)}`}>
                {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
              </span>
              <div className="btn-group">
                <button
                  onClick={() => handleServerAction('start')}
                  disabled={actionLoading !== null || server.status === 'running'}
                  className="btn btn-sm btn-success"
                >
                  {actionLoading === 'start' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '▶️ Start'
                  )}
                </button>
                <button
                  onClick={() => handleServerAction('stop')}
                  disabled={actionLoading !== null || server.status === 'stopped'}
                  className="btn btn-sm btn-error"
                >
                  {actionLoading === 'stop' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '⏹️ Stop'
                  )}
                </button>
                <button
                  onClick={() => handleServerAction('restart')}
                  disabled={actionLoading !== null}
                  className="btn btn-sm btn-warning"
                >
                  {actionLoading === 'restart' ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    '🔄 Restart'
                  )}
                </button>
              </div>
              
              {/* Start Script Viewer Button - Only show for native/cluster servers */}
              {(server.type === 'native' || server.type === 'cluster-server') && (
                <button
                  onClick={() => setShowStartScript(true)}
                  className="btn btn-sm btn-outline btn-info ml-2"
                >
                  📜 View Start Script
                </button>
              )}
              
              {/* Update Server Button */}
              <button
                onClick={() => setShowUpdateManager(true)}
                className="btn btn-sm btn-outline btn-accent ml-2"
              >
                🔄 Update Server
              </button>
              
              {/* Settings Button */}
              <button
                onClick={() => setShowSettingsEditor(true)}
                className="btn btn-sm btn-outline btn-primary ml-2"
              >
                ⚙️ Settings
              </button>

              {/* Backup Button */}
              <button
                onClick={openServerBackupModal}
                className="btn btn-sm btn-outline btn-secondary ml-2"
              >
                🗄️ Backup
              </button>

              {/* Restore Button */}
              <button
                onClick={openServerRestoreModal}
                className="btn btn-sm btn-outline btn-warning ml-2"
              >
                ♻️ Restore
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('details')}
          >
            📊 Details
          </button>
          <button
            className={`tab ${activeTab === 'rcon' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('rcon')}
          >
            🖥️ RCON Console
          </button>
          <button
            className={`tab ${activeTab === 'mods' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('mods')}
          >
            🎮 Mods
          </button>
          <button
            className={`tab ${activeTab === 'config' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('config')}
          >
            ⚙️ Configuration
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('logs')}
          >
            📋 Logs
          </button>
          <button
            className={`tab ${activeTab === 'saves' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('saves')}
          >
            💾 Save Files
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-sm flex-1">
          <div className="card-body">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Live Server Information - Prioritized */}
                {server.status === 'running' && (
                  <div className="mb-6">
                    <ServerLiveDetails 
                      serverName={server.name} 
                      serverType={server.type} 
                    />
                  </div>
                )}

                {/* Server Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Server Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Name:</span>
                          <span className="font-medium">{server.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Type:</span>
                          <span className="badge badge-outline">{getTypeLabel(server.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/70">Status:</span>
                          <span className={`badge ${getStatusColor(server.status)}`}>
                            {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                          </span>
                        </div>
                        {server.map && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Map:</span>
                            <span>{getMapDisplayName(server.map)}</span>
                          </div>
                        )}
                        {server.clusterName && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Cluster:</span>
                            <span>{server.clusterName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Network Information</h4>
                      <div className="space-y-2">
                        {server.gamePort && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Game Port:</span>
                            <span>{server.gamePort}</span>
                          </div>
                        )}
                        {server.queryPort && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Query Port:</span>
                            <span>{server.queryPort}</span>
                          </div>
                        )}
                        {server.rconPort && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">RCON Port:</span>
                            <span>{server.rconPort}</span>
                          </div>
                        )}
                        {server.maxPlayers && (
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Max Players:</span>
                            <span>{server.maxPlayers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Section - Collapsible */}
                {server.config && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="card-title">Configuration</h4>
                        <button
                          onClick={() => setConfigSectionExpanded(!configSectionExpanded)}
                          className="btn btn-sm btn-outline"
                        >
                          {configSectionExpanded ? '🔽 Collapse' : '▶️ Expand'}
                        </button>
                      </div>
                      {configSectionExpanded && (
                        <pre className="text-xs bg-base-300 p-4 rounded overflow-auto max-h-64">
                          {JSON.stringify(server.config, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rcon' && (
              <ServerDetailsRconConsole serverName={server.name} />
            )}

            {activeTab === 'mods' && (
              <ServerModManager serverName={server.name} onClose={() => setActiveTab('details')} />
            )}

            {activeTab === 'config' && (
              <ServerConfigEditor serverName={server.name} />
            )}

            {activeTab === 'logs' && (
              <ServerLogViewer serverName={serverName} />
            )}

            {activeTab === 'saves' && server && (
              <SaveFileManager 
                serverName={server.name} 
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Start Script Viewer Modal */}
      {showStartScript && server && (
        <StartScriptViewer
          serverName={server.name}
          onClose={() => setShowStartScript(false)}
        />
      )}

      {/* Server Update Manager Modal */}
      {showUpdateManager && (
        <ServerUpdateManager onClose={() => setShowUpdateManager(false)} />
      )}

      {/* Server Settings Editor Modal */}
      {showSettingsEditor && server && (
        <ServerSettingsEditor
          server={server}
          onClose={() => setShowSettingsEditor(false)}
          onSave={() => {
            // Reload server data to reflect changes
            window.location.reload();
          }}
        />
      )}

      {/* Server Backup Modal */}
      {showServerBackupModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Available Backups for {serverName}</h3>
            {serverBackupLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : serverBackupError ? (
              <div className="alert alert-error mb-4">{serverBackupError}</div>
            ) : serverBackups.length === 0 ? (
              <div className="text-base-content/70">No backups found for this server.</div>
            ) : (
              <ul className="space-y-3">
                {serverBackups.map((b: { name: string; backupDate?: string; serverName: string }) => (
                  <li key={b.name} className="flex items-center justify-between bg-base-200 rounded p-3">
                    <div>
                      <div className="font-mono text-sm">{b.name}</div>
                      <div className="text-xs text-base-content/70">{b.backupDate ? new Date(b.backupDate).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={downloadServerBackupLoading === b.name}
                        onClick={() => handleDownloadServerBackup(b.name)}
                      >
                        {downloadServerBackupLoading === b.name ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          '⬇️ Download'
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleDeleteServerBackup(b.name)}
                        title="Delete backup"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-action">
              <button className="btn" onClick={() => setShowServerBackupModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Server Restore Modal */}
      {showServerRestoreModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Restore Server Saves</h3>
            <form onSubmit={handleServerRestoreSubmit} className="space-y-4">
              <div>
                <label className="label">Target Server</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={serverName || ''}
                  disabled
                />
              </div>
              <div>
                <label className="label">Backup ZIP File</label>
                <input
                  type="file"
                  accept=".zip"
                  className="file-input file-input-bordered w-full"
                  onChange={handleServerRestoreFileChange}
                  disabled={serverRestoreLoading}
                />
              </div>
              {serverRestoreError && <div className="alert alert-error">{serverRestoreError}</div>}
              {serverRestoreSuccess && <div className="alert alert-success">{serverRestoreSuccess}</div>}
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowServerRestoreModal(false)} disabled={serverRestoreLoading}>Cancel</button>
                <button type="submit" className="btn btn-warning" disabled={serverRestoreLoading}>
                  {serverRestoreLoading ? <span className="loading loading-spinner loading-xs"></span> : '♻️ Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDetails; 