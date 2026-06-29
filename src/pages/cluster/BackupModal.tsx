import type { ClusterBackup } from "./types";

interface BackupModalProps {
  backups: ClusterBackup[];
  backupLoading: boolean;
  backupError: string | null;
  downloadBackupLoading: string | null;
  onDownloadBackup: (backupName: string) => void;
  onClose: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({
  backups,
  backupLoading,
  backupError,
  downloadBackupLoading,
  onDownloadBackup,
  onClose,
}) => {
  return (
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
          <div className="text-base-content/70">
            No backups found for this cluster.
          </div>
        ) : (
          <ul className="space-y-3">
            {backups.map((b) => (
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
                  disabled={downloadBackupLoading === b.backupName}
                  onClick={() => onDownloadBackup(b.backupName)}
                >
                  {downloadBackupLoading === b.backupName ? (
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

export default BackupModal;
