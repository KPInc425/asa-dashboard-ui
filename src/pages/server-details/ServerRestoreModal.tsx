import React from "react";

interface ServerRestoreModalProps {
  serverName: string;
  loading: boolean;
  error: string;
  success: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ServerRestoreModal: React.FC<ServerRestoreModalProps> = ({
  serverName,
  loading,
  error,
  success,
  onFileChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Restore Server Saves</h3>
        <form onSubmit={onSubmit} className="space-y-4">
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
              onChange={onFileChange}
              disabled={loading}
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-warning"
              disabled={loading}
            >
              {loading ? (
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
