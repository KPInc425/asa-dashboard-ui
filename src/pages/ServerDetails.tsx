import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext2';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Server } from '../utils/serverUtils';
import { provisioningApi } from '../services';
import { 
  useServerDetails, 
  useServerLiveDataDynamic,
  useRefetchServers 
} from '../hooks/useServerData';
import { useServerCommand } from '../hooks/useServerCommand';
import ServerModManager from '../components/ServerModManager';
import ServerConfigEditor from '../components/ServerConfigEditor';
import ServerLogViewer from '../components/ServerLogViewer';
import StartScriptViewer from '../components/StartScriptViewer';
import ServerUpdateManager from '../components/ServerUpdateManager';
import ServerSettingsEditor from '../components/ServerSettingsEditor';
import ServerLiveDetails from '../components/ServerLiveDetails';
import SaveFileManager from '../components/SaveFileManager';
import ServerDetailsRconConsole from '../components/ServerDetailsRconConsole';
import TransitionProgress from '../components/TransitionProgress';

const ServerDetails: React.FC = () => {
  const { serverName } = useParams<{ serverName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'details' | 'rcon' | 'config' | 'logs' | 'mods' | 'saves'>('details');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStartScript, setShowStartScript] = useState(false);
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  const [configSectionExpanded, setConfigSectionExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  // Use centralized hooks for server data and mutations
  const { 
    data: serverData, 
    isLoading: loading, 
    error: queryError,
    refetch: refetchServer 
  } = useServerDetails(serverName);

  // Use dynamic polling for live data with transition tracking
  const {
    data: liveData,
    transitionTracker,
    isTransitioning,
    isRefetching,
  } = useServerLiveDataDynamic(
    serverName,
    serverData?.type === 'container' ? 'container' : 'native'
  );

  const { refetchServer: invalidateServer } = useRefetchServers();

  // Convert to Server type for backward compatibility
  const server: Server | null = serverData ? {
    ...serverData,
    status: (liveData?.status || serverData.status) as Server['status'],
    type: serverData.type as Server['type'],
  } : null;

  // Server command mutations with optimistic updates
  const {
    startMutation,
    safeStopMutation,
    safeRestartMutation,
  } = useServerCommand({
    onSuccess: (action, serverId) => {
      console.log(`✅ ${action} completed for ${serverId}`);
      refetchServer();
      invalidateServer(serverId);
    },
    onError: (action, _serverId, err) => {
      setError(`Failed to ${action} server: ${err.message}`);
    },
  });

  // Handle query error
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Failed to load server');
    }
  }, [queryError]);

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

  // Server control actions using mutations
  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!server || !serverName) return;
    
    setActionLoading(action);
    setError(null);
    
    try {
      const serverType = server.type === 'container' ? 'container' : 'native';
      
      console.log(`🔄 Attempting to ${action} server: ${server.name} (type: ${server.type})`);
      
      if (action === 'start') {
        await startMutation.mutateAsync({ serverId: serverName, serverType });
      } else if (action === 'stop') {
        await safeStopMutation.mutateAsync({ serverId: serverName, serverType });
      } else if (action === 'restart') {
        await safeRestartMutation.mutateAsync({ serverId: serverName, serverType });
      }
      
      // Note: refetch is handled by onSuccess callback in useServerCommand
    } catch (err: unknown) {
      console.error(`Failed to ${action} server:`, err);
      // Error is handled by mutation onError
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation handlers for destructive actions
  const handleStopWithConfirmation = async () => {
    if (!server) return;
    const proceed = await showConfirm(`Are you sure you want to stop the server "${server.name}"? This will disconnect all players.`);
    if (proceed) await handleServerAction('stop');
  };

  const handleRestartWithConfirmation = async () => {
    if (!server) return;
    const proceed = await showConfirm(`Are you sure you want to restart the server "${server.name}"? This will disconnect all players and restart the server.`);
    if (proceed) await handleServerAction('restart');
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
        const serverBackups = (result.data?.backups as any[] || []).filter((b: any) => b.serverName === serverName);
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
      try { showToast('Failed to download server backup', 'error'); } catch { /* noop */ }
    } finally {
      setDownloadServerBackupLoading('');
    }
  };

  const handleDeleteServerBackup = async (backupName: string) => {
    if (!serverName) return;
    const proceed = await showConfirm(`Are you sure you want to delete backup "${backupName}"? This action cannot be undone.`);
    if (!proceed) return;

    try {
      const response = await provisioningApi.deleteServerBackup(serverName, backupName);
      if (response.success) {
        // Remove from local state
        setServerBackups(prev => prev.filter(b => b.name !== backupName));
      } else {
        try { showToast(`Failed to delete backup: ${response.message}`, 'error'); } catch {}
      }
    } catch (err: unknown) {
      console.error('Failed to delete backup:', err);
      try { showToast('Failed to delete backup', 'error'); } catch {}
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
                  onClick={handleStopWithConfirmation}
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
                  onClick={handleRestartWithConfirmation}
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
                {/* Transition Progress - Show during server transitions */}
                {isTransitioning && (
                  <TransitionProgress
                    status={liveData?.status || server.status}
                    transitionStartedAt={transitionTracker.transitionStartedAt}
                    expectedDuration={transitionTracker.expectedDuration}
                    previousStatus={transitionTracker.previousStatus}
                    variant="full"
                    onStuck={() => {
                      showToast('Server transition is taking longer than expected. Check the logs for details.', 'warning');
                    }}
                  />
                )}

                {/* Live Server Information - Show when running (and not transitioning) */}
                {server.status === 'running' && !isTransitioning && (
                  <div className="mb-6">
                    <ServerLiveDetails 
                      serverName={server.name} 
                      serverType={server.type} 
                    />
                  </div>
                )}

                {/* Refetching indicator */}
                {isRefetching && !isTransitioning && (
                  <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <span className="loading loading-spinner loading-xs"></span>
                    <span>Refreshing data...</span>
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
            // Refresh server data to reflect changes
            refetchServer();
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