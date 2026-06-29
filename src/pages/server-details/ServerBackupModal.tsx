import React from "react";

interface BackupItem {
  name: string;
  backupDate?: string;
  serverName: string;
}

interface ServerBackupModalProps {
  serverName: string;
  loading: boolean;
  error: string;
  backups: BackupItem[];
  downloadLoading: string;
  onDownload: (backupName: string) => void;
  onDelete: (backupName: string) => void;
  onClose: () => void;
}

const ServerBackupModal: React.FC<ServerBackupModalProps> = ({
  serverName,
  loading,
  error,
  backups,
  downloadLoading,
  onDownload,
  onDelete,
  onClose,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">
          Available Backups for {serverName}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="alert alert-error mb-4">{error}</div>
        ) : backups.length === 0 ? (
          <div className="text-base-content/70">
            No backups found for this server.
          </div>
        ) : (
          <ul className="space-y-3">
            {backups.map((b) => (
              <li
                key={b.name}
                className="flex items-center justify-between bg-base-200 rounded p-3"
              >
                <div>
                  <div className="font-mono text-sm">{b.name}</div>
                  <div className="text-xs text-base-content/70">
                    {b.backupDate
                      ? new Date(b.backupDate).toLocaleString()
                      : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={downloadLoading === b.name}
                    onClick={() => onDownload(b.name)}
                  >
                    {downloadLoading === b.name ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "⬇️ Download"
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => onDelete(b.name)}
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
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerBackupModal;
