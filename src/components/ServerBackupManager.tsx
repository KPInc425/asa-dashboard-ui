import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ServerBackup {
  name: string;
  path: string;
  serverName: string;
  originalCluster: string;
  backupDate: string;
  size: number;
  sizeFormatted: string;
  serverConfig?: any;
  clusterInfo?: any;
}

interface ServerBackupManagerProps {
  onClose: () => void;
  selectedServer?: string;
}

const ServerBackupManager: React.FC<ServerBackupManagerProps> = ({ onClose, selectedServer }) => {
  const [backups, setBackups] = useState<ServerBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<ServerBackup | null>(null);
  const [backupOptions, setBackupOptions] = useState({
    includeConfigs: true,
    includeScripts: false,
    customDestination: ''
  });
  const [restoreOptions, setRestoreOptions] = useState({
    targetClusterName: '',
    overwrite: false,
    customSource: ''
  });

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await apiService.provisioning.listServerBackups();
      if (response.success && response.data?.backups) {
        setBackups(response.data.backups as ServerBackup[]);
      }
    } catch (error: any) {
      console.error('Failed to load server backups:', error);
      setStatusMessage(`❌ Failed to load backups: ${error.message}`);
      setStatusType('error');
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const backupServer = async () => {
    if (!selectedServer) return;

    try {
      setLoading(true);
      setStatusMessage(`Backing up server "${selectedServer}"...`);
      setStatusType('info');

      const options: any = {
        includeConfigs: backupOptions.includeConfigs,
        includeScripts: backupOptions.includeScripts
      };

      if (backupOptions.customDestination) {
        options.destination = backupOptions.customDestination;
      }

      const response = await apiService.provisioning.backupServer(selectedServer, options);
      
      if (response.success) {
        setStatusMessage(`✅ Server "${selectedServer}" backed up successfully! Backup location: ${response.data?.backupPath || 'Unknown'}`);
        setStatusType('success');
        setShowBackupModal(false);
        loadBackups(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Failed to backup server:', error);
      setStatusMessage(`❌ Failed to backup server "${selectedServer}": ${error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  const restoreServer = async () => {
    if (!selectedBackup) return;

    try {
      setLoading(true);
      setStatusMessage(`Restoring server "${selectedBackup.serverName}"...`);
      setStatusType('info');

      const sourcePath = restoreOptions.customSource || selectedBackup.path;
      const options: any = {
        overwrite: restoreOptions.overwrite
      };

      if (restoreOptions.targetClusterName) {
        options.targetClusterName = restoreOptions.targetClusterName;
      }

      const response = await apiService.provisioning.restoreServer(selectedBackup.serverName, sourcePath, options);
      
      if (response.success) {
        setStatusMessage(`✅ Server "${selectedBackup.serverName}" restored successfully!`);
        setStatusType('success');
        setShowRestoreModal(false);
        setSelectedBackup(null);
      }
    } catch (error: any) {
      console.error('Failed to restore server:', error);
      setStatusMessage(`❌ Failed to restore server "${selectedBackup?.serverName}": ${error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  const deleteBackup = async (backup: ServerBackup) => {
    if (!confirm(`Are you sure you want to delete backup "${backup.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(`Deleting backup "${backup.name}"...`);
      setStatusType('info');

      // Note: We'll need to add a delete backup endpoint to the backend
      // For now, we'll just show a message
      setStatusMessage(`❌ Delete backup functionality not yet implemented`);
      setStatusType('error');
    } catch (error: any) {
      console.error('Failed to delete backup:', error);
      setStatusMessage(`❌ Failed to delete backup: ${error.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Server Backup Manager</h2>
            <p className="text-base-content/70 mt-2">
              Manage individual server backups
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            ✕
          </button>
        </div>

        {/* Quick Backup Section */}
        {selectedServer && (
          <div className="card bg-base-200 shadow-lg mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title text-lg">Quick Backup</h3>
                  <p className="text-sm text-base-content/70">
                    Backup server: <span className="font-semibold">{selectedServer}</span>
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowBackupModal(true)}
                  disabled={loading}
                >
                  💾 Backup Server
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backups List */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-lg">Available Backups</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={loadBackups}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <p>No server backups found</p>
                <p className="text-sm">Create a backup to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Server Name</th>
                      <th>Original Cluster</th>
                      <th>Backup Date</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.name}>
                        <td className="font-semibold">{backup.serverName}</td>
                        <td>{backup.originalCluster}</td>
                        <td>{formatDate(backup.backupDate)}</td>
                        <td>{backup.sizeFormatted}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              className="btn btn-xs btn-outline btn-warning"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              title="Restore server"
                            >
                              🔄
                            </button>
                            <button
                              className="btn btn-xs btn-outline btn-error"
                              onClick={() => deleteBackup(backup)}
                              title="Delete backup"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Backup Modal */}
        {showBackupModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Backup Server: {selectedServer}</h3>
              
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Include Configs</span>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={backupOptions.includeConfigs}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, includeConfigs: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Include Scripts</span>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={backupOptions.includeScripts}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, includeScripts: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Custom Destination (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Leave empty for default location"
                    value={backupOptions.customDestination}
                    onChange={(e) => setBackupOptions(prev => ({ ...prev, customDestination: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowBackupModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={backupServer}
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Backup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore Modal */}
        {showRestoreModal && selectedBackup && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Restore Server: {selectedBackup.serverName}</h3>
              
              <div className="space-y-4">
                <div className="alert alert-info">
                  <span>Original Cluster: {selectedBackup.originalCluster}</span>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Target Cluster (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Leave empty to restore to original cluster"
                    value={restoreOptions.targetClusterName}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, targetClusterName: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Overwrite if exists</span>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={restoreOptions.overwrite}
                      onChange={(e) => setRestoreOptions(prev => ({ ...prev, overwrite: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Custom Source Path (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Leave empty to use backup path"
                    value={restoreOptions.customSource}
                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, customSource: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackup(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning"
                  onClick={restoreServer}
                  disabled={loading}
                >
                  {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 alert alert-${statusType} shadow-lg z-50 max-w-md`}>
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerBackupManager; 