interface ServerRestoreModalProps {
  serverName: string;
  restoreFile: File | null;
  restoreLoading: boolean;
  restoreError: string;
  restoreSuccess: string;
  onFileChange: (serverName: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (serverName: string, e: React.FormEvent) => void;
  onClose: () => void;
}

const ServerRestoreModal: React.FC<ServerRestoreModalProps> = ({
  serverName,
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
        <h3 className="font-bold text-lg mb-4">Restore Server Saves</h3>
        <form
          onSubmit={(e) => onSubmit(serverName, e)}
          className="space-y-4"
        >
          <div>
            <label className="label">Target Server</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={serverName}
              disabled
            />
          </div>
          <div>
            <label className="label">Backup ZIP File</label>
            <input
              type="file"
              accept=".zip"
              className="file-input file-input-bordered w-full"
              onChange={(e) => onFileChange(serverName, e)}
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

export default ServerRestoreModal;
