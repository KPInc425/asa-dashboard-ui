import type { Cluster } from "./types";

interface ClusterOverviewProps {
  cluster: Cluster;
  actionLoading: string | null;
  downloadLoading: boolean;
  downloadError: string | null;
  onClusterAction: (action: "start" | "stop" | "restart") => void;
  onDownloadConfig: () => void;
  onOpenBackupModal: () => void;
  onOpenRestoreModal: () => void;
  onShowBackupOptions: () => void;
  onShowRestoreOptions: () => void;
}

const ClusterOverview: React.FC<ClusterOverviewProps> = ({
  cluster,
  actionLoading,
  downloadLoading,
  downloadError,
  onClusterAction,
  onDownloadConfig,
  onOpenBackupModal,
  onOpenRestoreModal,
  onShowBackupOptions,
  onShowRestoreOptions,
}) => {
  return (
    <div className="space-y-6">
      {/* Cluster Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title">Cluster Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Name:</span>
                <span className="font-medium">{cluster.name}</span>
              </div>
              {cluster.config?.description && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Description:</span>
                  <span className="font-medium">
                    {cluster.config.description}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-base-content/70">Created:</span>
                <span>
                  {cluster.created
                    ? new Date(cluster.created).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Path:</span>
                <div
                  className="font-mono text-xs truncate max-w-48"
                  title={cluster.path}
                >
                  {cluster.path}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title">Server Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Total Servers:</span>
                <span>{cluster.config?.servers?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Running:</span>
                <span className="text-success">
                  {cluster.config?.servers?.filter(
                    (s: { status: string }) => s.status === "running",
                  ).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Stopped:</span>
                <span className="text-error">
                  {cluster.config?.servers?.filter(
                    (s: { status: string }) => s.status === "stopped",
                  ).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Other:</span>
                <span className="text-warning">
                  {cluster.config?.servers?.filter(
                    (s: { status: string }) =>
                      s.status !== "running" && s.status !== "stopped",
                  ).length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Actions */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h4 className="card-title">Cluster Actions</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onClusterAction("start")}
              disabled={actionLoading === "start"}
              className="btn btn-success"
              title="Start all servers in this cluster."
            >
              {actionLoading === "start" ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "▶️ Start All"
              )}
            </button>
            <button
              onClick={() => onClusterAction("stop")}
              disabled={actionLoading === "stop"}
              className="btn btn-error"
              title="Stop all servers in this cluster."
            >
              {actionLoading === "stop" ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "⏹️ Stop All"
              )}
            </button>
            <button
              onClick={() => onClusterAction("restart")}
              disabled={actionLoading === "restart"}
              className="btn btn-warning"
              title="Restart all servers in this cluster."
            >
              {actionLoading === "restart" ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "🔄 Restart All"
              )}
            </button>
            <button
              onClick={onDownloadConfig}
              disabled={downloadLoading}
              className="btn btn-outline btn-info"
              title="Download the cluster configuration as a JSON file."
            >
              {downloadLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "⬇️ Download Config"
              )}
            </button>
            <button
              onClick={onOpenBackupModal}
              className="btn btn-outline btn-secondary"
              title="Download a previously created backup archive (ZIP) for this cluster."
            >
              🗄️ Download Backup
            </button>
            <button
              onClick={onOpenRestoreModal}
              className="btn btn-outline btn-warning"
              title="Restore the entire cluster from a previously created backup archive (ZIP)."
            >
              ♻️ Restore from Backup
            </button>
          </div>
          <span className="text-xs text-base-content/60 block mt-1">
            <b>Restore from Backup:</b> Restore the entire cluster from a
            previously created backup archive (ZIP).
            <br />
            <b>Restore Cluster Data:</b> Restore specific data types (saves,
            configs, logs) for this cluster. You can select which data to
            restore.
          </span>
          {downloadError && (
            <div className="alert alert-error mt-2">
              <span>{downloadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      {cluster.config && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title">Configuration</h4>
            <div className="space-y-2">
              {cluster.config.maps && cluster.config.maps.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Maps:</span>
                  <span>{cluster.config.maps.join(", ")}</span>
                </div>
              )}
              {cluster.config.clusterPassword && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">
                    Cluster Password:
                  </span>
                  <span className="font-mono">••••••••</span>
                </div>
              )}
              {cluster.config.customDynamicConfigUrl && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">
                    Custom Config URL:
                  </span>
                  <span
                    className="font-mono text-xs truncate max-w-64"
                    title={cluster.config.customDynamicConfigUrl}
                  >
                    {cluster.config.customDynamicConfigUrl}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <button
          className="btn btn-info"
          onClick={onShowBackupOptions}
        >
          Backup Cluster Data
        </button>
        <button
          className="btn btn-warning"
          onClick={onShowRestoreOptions}
        >
          Restore Cluster Data
        </button>
      </div>
    </div>
  );
};

export default ClusterOverview;
