import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface UpdateConfig {
  serverName: string;
  clusterName: string | null;
  updateOnStart: boolean;
  lastUpdate: string | null;
  updateEnabled: boolean;
  autoUpdate: boolean;
  updateInterval: number;
  updateSchedule: string | null;
}

interface UpdateStatus {
  needsUpdate: boolean;
  reason: string;
  lastUpdate: string | null;
  updateInterval?: number;
  updateOnStart?: boolean;
  updateEnabled?: boolean;
}

interface ServerUpdateInfo {
  serverName: string;
  clusterName: string;
  status: UpdateStatus;
  config: UpdateConfig;
  error?: string;
}

interface ServerUpdateManagerProps {
  onClose: () => void;
}

const ServerUpdateManager: React.FC<ServerUpdateManagerProps> = ({ onClose }) => {
  const [servers, setServers] = useState<ServerUpdateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalData, setConfigModalData] = useState<UpdateConfig | null>(null);
  const [backgroundUpdates, setBackgroundUpdates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUpdateStatus();
  }, []);

  // Auto-refresh when background updates are running
  useEffect(() => {
    if (backgroundUpdates.size > 0) {
      const interval = setInterval(() => {
        loadUpdateStatus();
      }, 10000); // Refresh every 10 seconds when background updates are running
      
      return () => clearInterval(interval);
    }
  }, [backgroundUpdates]);

  const loadUpdateStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/provisioning/update-status-all');
      if (response.data.success) {
        setServers(response.data.data);
        
        // Clear background updates for servers that have recent updates
        const now = new Date();
        const recentThreshold = 5 * 60 * 1000; // 5 minutes
        
        setBackgroundUpdates(prev => {
          const newSet = new Set(prev);
          response.data.data.forEach((server: ServerUpdateInfo) => {
            if (server.config.lastUpdate) {
              const lastUpdate = new Date(server.config.lastUpdate);
              if (now.getTime() - lastUpdate.getTime() < recentThreshold) {
                newSet.delete(server.serverName);
              }
            }
          });
          return newSet;
        });
      } else {
        setError('Failed to load update status');
      }
    } catch (err) {
      setError('Failed to load update status');
      console.error('Error loading update status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateServer = async (serverName: string, force: boolean = false) => {
    try {
      setUpdating(true);
      setError(null);
      
      const response = await api.post(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-with-config`, {
        force,
        updateConfig: true,
        background: true // Use background updates to avoid timeouts
      });
      
      if (response.data.success) {
        if (response.data.data.background) {
          setSuccess(`Update started for server ${serverName}. Progress will be tracked in the background.`);
          setBackgroundUpdates(prev => new Set([...prev, serverName]));
        } else {
          setSuccess(`Server ${serverName} updated successfully`);
        }
        await loadUpdateStatus(); // Refresh the list
      } else {
        setError(`Failed to update server: ${response.data.message}`);
      }
    } catch (err) {
      let errorMessage = 'Failed to update server';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Update timed out. SteamCMD updates can take a long time. The update may still be running in the background.';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection to the server.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAllServers = async (force: boolean = false) => {
    try {
      setUpdating(true);
      setError(null);
      
      const response = await api.post('/api/provisioning/update-all-servers-with-config', {
        force,
        updateConfig: true,
        skipDisabled: true,
        background: true // Use background updates to avoid timeouts
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        await loadUpdateStatus(); // Refresh the list
      } else {
        setError(`Failed to update servers: ${response.data.message}`);
      }
    } catch (err) {
      let errorMessage = 'Failed to update servers';
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Update timed out. SteamCMD updates can take a long time. Updates may still be running in the background.';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection to the server.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateConfig = async (serverName: string, config: Partial<UpdateConfig>) => {
    try {
      const response = await api.put(`/api/provisioning/servers/${encodeURIComponent(serverName)}/update-config`, config);
      
      if (response.data.success) {
        setSuccess('Update configuration saved successfully');
        await loadUpdateStatus(); // Refresh the list
        setShowConfigModal(false);
      } else {
        setError(`Failed to save configuration: ${response.data.message}`);
      }
    } catch (err) {
      setError(`Failed to save configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };



  const openConfigModal = (server: ServerUpdateInfo) => {
    setConfigModalData(server.config);
    setSelectedServer(server.serverName);
    setShowConfigModal(true);
  };

  const formatLastUpdate = (lastUpdate: string | null) => {
    if (!lastUpdate) return 'Never';
    const date = new Date(lastUpdate);
    return date.toLocaleString();
  };

  const getStatusColor = (needsUpdate: boolean) => {
    return needsUpdate ? 'text-warning' : 'text-success';
  };

  const getStatusIcon = (needsUpdate: boolean) => {
    return needsUpdate ? '⚠️' : '✅';
  };

  if (loading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-base-content/70">Loading update status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Server Update Manager</h3>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>
          )}

          {/* Global Actions */}
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300/30 rounded-xl p-4 mb-6">
            <h4 className="text-lg font-semibold mb-3">Global Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleUpdateAllServers(false)}
                disabled={updating}
                className="btn btn-primary btn-sm"
              >
                {updating ? <span className="loading loading-spinner loading-xs"></span> : '🔄'}
                Update All Servers
              </button>
              <button
                onClick={() => handleUpdateAllServers(true)}
                disabled={updating}
                className="btn btn-warning btn-sm"
              >
                {updating ? <span className="loading loading-spinner loading-xs"></span> : '⚡'}
                Force Update All
              </button>
              <button
                onClick={loadUpdateStatus}
                disabled={updating}
                className="btn btn-outline btn-sm"
              >
                🔄 Refresh Status
              </button>

            </div>
            <div className="mt-3 text-sm text-base-content/70">
              <p>💡 <strong>Background Updates:</strong> Updates run in the background to avoid timeouts. Progress is tracked automatically.</p>
              <p>🛑 <strong>Stop Scripts:</strong> Regenerates targeted stop scripts that only stop specific servers, not all servers.</p>
              <p>🔧 <strong>Port Configurations:</strong> Fixes port conflicts by using correct ASA port offsets (Game+1 for Query, Game+2 for RCON).</p>
            </div>
          </div>

          {/* Servers List */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Server Update Status</h4>
            
            {servers.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                No servers found
              </div>
            ) : (
              <div className="grid gap-4">
                {servers.map((server) => (
                  <div key={server.serverName} className="card bg-base-100 border border-base-300">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold">{server.serverName}</h5>
                            <span className="badge badge-outline badge-sm">{server.clusterName}</span>
                            <span className={`text-sm ${getStatusColor(server.status.needsUpdate)}`}>
                              {getStatusIcon(server.status.needsUpdate)} {server.status.reason}
                            </span>
                            {backgroundUpdates.has(server.serverName) && (
                              <span className="badge badge-info badge-sm animate-pulse">
                                🔄 Background Update
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-base-content/70 space-y-1">
                            <div>Last Update: {formatLastUpdate(server.status.lastUpdate)}</div>
                            {server.config && (
                              <>
                                <div>Update on Start: {server.config.updateOnStart ? '✅' : '❌'}</div>
                                <div>Auto Update: {server.config.autoUpdate ? '✅' : '❌'}</div>
                                {server.config.autoUpdate && (
                                  <div>Update Interval: {server.config.updateInterval} hours</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleUpdateServer(server.serverName, false)}
                            disabled={updating}
                            className="btn btn-sm btn-primary"
                          >
                            {updating ? <span className="loading loading-spinner loading-xs"></span> : '🔄'}
                            Update
                          </button>
                          <button
                            onClick={() => handleUpdateServer(server.serverName, true)}
                            disabled={updating}
                            className="btn btn-sm btn-warning"
                          >
                            {updating ? <span className="loading loading-spinner loading-xs"></span> : '⚡'}
                            Force
                          </button>
                          <button
                            onClick={() => openConfigModal(server)}
                            className="btn btn-sm btn-outline"
                          >
                            ⚙️ Config
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && configModalData && (
        <UpdateConfigModal
          config={configModalData}
          serverName={selectedServer!}
          onSave={handleUpdateConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </>
  );
};

// Update Configuration Modal Component
interface UpdateConfigModalProps {
  config: UpdateConfig;
  serverName: string;
  onSave: (serverName: string, config: Partial<UpdateConfig>) => Promise<void>;
  onClose: () => void;
}

const UpdateConfigModal: React.FC<UpdateConfigModalProps> = ({ config, serverName, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    updateOnStart: config.updateOnStart,
    updateEnabled: config.updateEnabled,
    autoUpdate: config.autoUpdate,
    updateInterval: config.updateInterval
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(serverName, formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-lg font-bold mb-4">Update Configuration - {serverName}</h3>
        
        <div className="space-y-4">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Enable Updates</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.updateEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, updateEnabled: e.target.checked }))}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Update on Start</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.updateOnStart}
                onChange={(e) => setFormData(prev => ({ ...prev, updateOnStart: e.target.checked }))}
                disabled={!formData.updateEnabled}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Auto Update</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.autoUpdate}
                onChange={(e) => setFormData(prev => ({ ...prev, autoUpdate: e.target.checked }))}
                disabled={!formData.updateEnabled}
              />
            </label>
          </div>

          {formData.autoUpdate && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Update Interval (hours)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={formData.updateInterval}
                onChange={(e) => setFormData(prev => ({ ...prev, updateInterval: parseInt(e.target.value) || 24 }))}
                min="1"
                max="168"
              />
            </div>
          )}
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <span className="loading loading-spinner loading-xs"></span> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerUpdateManager; 