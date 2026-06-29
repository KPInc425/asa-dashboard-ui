import type { Cluster } from "./types";

interface BackupOptionsModalProps {
  cluster: Cluster | null;
  backupOptions: { saves: boolean; configs: boolean; logs: boolean };
  downloadLoading: boolean;
  downloadError: string | null;
  onOptionChange: (options: { saves: boolean; configs: boolean; logs: boolean }) => void;
  onStartBackup: () => void;
  onClose: () => void;
}

const BackupOptionsModal: React.FC<BackupOptionsModalProps> = ({
  backupOptions,
  downloadLoading,
  onOptionChange,
  onStartBackup,
  onClose,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Backup Cluster Data</h3>
        <form>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={backupOptions.saves}
              onChange={(e) =>
                onOptionChange({ ...backupOptions, saves: e.target.checked })
              }
            />
            <span className="ml-2">Saves</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={backupOptions.configs}
              onChange={(e) =>
                onOptionChange({ ...backupOptions, configs: e.target.checked })
              }
            />
            <span className="ml-2">Configs</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={backupOptions.logs}
              onChange={(e) =>
                onOptionChange({ ...backupOptions, logs: e.target.checked })
              }
            />
            <span className="ml-2">Logs</span>
          </label>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="btn btn-primary"
              disabled={downloadLoading}
              onClick={onStartBackup}
            >
              {downloadLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Start Backup"
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BackupOptionsModal;
