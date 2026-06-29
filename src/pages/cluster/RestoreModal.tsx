import type { Cluster } from "./types";

interface RestoreModalProps {
  cluster: Cluster;
  restoreFile: File | null;
  restoreLoading: boolean;
  restoreError: string | null;
  restoreSuccess: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const RestoreModal: React.FC<RestoreModalProps> = ({
  cluster,
  restoreFile,
  restoreLoading,
  restoreError,
  restoreSuccess,
  onFileChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Restore from Backup</h3>
        <p className="text-xs text-base-content/60 mb-2">
          Restore the entire cluster from a previously created backup archive
          (ZIP). This will overwrite all current data with the contents of the
          backup.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
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
              onChange={onFileChange}
              disabled={restoreLoading}
            />
          </div>
          {restoreError && (
            <div className="alert alert-error">{restoreError}</div>
          )}
          {restoreSuccess && (
            <div className="alert alert-success">{restoreSuccess}</div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={restoreLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-warning"
              disabled={restoreLoading}
            >
              {restoreLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "♻️ Restore"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestoreModal;
