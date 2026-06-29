interface RestoreOptionsModalProps {
  restoreOptions: { saves: boolean; configs: boolean; logs: boolean };
  restoreLoading: boolean;
  onOptionChange: (options: { saves: boolean; configs: boolean; logs: boolean }) => void;
  onStartRestore: () => void;
  onClose: () => void;
}

const RestoreOptionsModal: React.FC<RestoreOptionsModalProps> = ({
  restoreOptions,
  restoreLoading,
  onOptionChange,
  onStartRestore,
  onClose,
}) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Restore Cluster Data</h3>
        <p className="text-xs text-base-content/60 mb-2">
          Restore specific data types (saves, configs, logs) for this cluster.
          You can select which data to restore. This will not affect other data
          types.
        </p>
        <form>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={restoreOptions.saves}
              onChange={(e) =>
                onOptionChange({ ...restoreOptions, saves: e.target.checked })
              }
            />
            <span className="ml-2">Saves</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={restoreOptions.configs}
              onChange={(e) =>
                onOptionChange({ ...restoreOptions, configs: e.target.checked })
              }
            />
            <span className="ml-2">Configs</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={restoreOptions.logs}
              onChange={(e) =>
                onOptionChange({ ...restoreOptions, logs: e.target.checked })
              }
            />
            <span className="ml-2">Logs</span>
          </label>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="btn btn-warning"
              disabled={restoreLoading}
              onClick={onStartRestore}
            >
              {restoreLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Start Restore"
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

export default RestoreOptionsModal;
