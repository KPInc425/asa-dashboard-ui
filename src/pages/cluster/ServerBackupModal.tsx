import type { ServerBackup } from "./types";

interface ServerBackupModalProps {
  serverName: string;
  backups: ServerBackup[];
  loading: boolean;
  error: string;
  downloadLoading: Record<string, boolean>;
  onDownloadBackup: (serverName: string, backupName: string) => void;
  onClose: () => void;
}

const ServerBackupModal: React.FC<ServerBackupModalProps> = ({
  serverName,
  backups,
  loading,
  error,
  downloadLoading,
  onDownloadBackup,
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
            {backups.map((b: ServerBackup) => (
              <li
                key={b.backupName}
                className="flex items-center justify-between bg-base-200 rounded p-3"
              >
                <div>
                  <div className="font-mono text-sm">{b.backupName}</div>
                  <div className="text-xs text-base-content/70">
                    {b.created ? new Date(b.created).toLocaleString() : ""}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={downloadLoading[b.backupName]}
                  onClick={() => onDownloadBackup(serverName, b.backupName)}
                >
                  {downloadLoading[b.backupName] ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "⬇️ Download ZIP"
                  )}
                </button>
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
