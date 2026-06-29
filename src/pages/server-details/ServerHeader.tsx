import React from "react";
import type { Server } from "../../utils/serverUtils";
import { getStatusColor, getUpdateStatusBadge } from "./helpers";

interface ServerHeaderProps {
  server: Server;
  actionLoading: string | null;
  autoUpdateStatusQuery: { data: unknown };
  supportsCapability: (cap: string) => boolean;
  onNavigateBack: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onShowStartScript: () => void;
  onShowUpdateManager: () => void;
  onShowSettingsEditor: () => void;
  onOpenBackupModal: () => void;
  onOpenRestoreModal: () => void;
}

const ServerHeader: React.FC<ServerHeaderProps> = ({
  server,
  actionLoading,
  autoUpdateStatusQuery,
  supportsCapability,
  onNavigateBack,
  onStart,
  onStop,
  onRestart,
  onShowStartScript,
  onShowUpdateManager,
  onShowSettingsEditor,
  onOpenBackupModal,
  onOpenRestoreModal,
}) => {
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onNavigateBack}
            className="btn btn-ghost btn-circle"
          >
            ←
          </button>
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-2xl">🦖</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-primary mb-1 truncate">
              {server.name}
            </h1>
            <p className="text-sm text-base-content/70 truncate">
              Server Management & Configuration
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`badge ${getStatusColor(server.status)}`}>
            {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
          </span>
          {getUpdateStatusBadge(autoUpdateStatusQuery)}
          {supportsCapability("canRestart") && (
            <div className="btn-group">
              <button
                onClick={onStart}
                disabled={
                  actionLoading !== null || server.status === "running"
                }
                className="btn btn-sm btn-success"
              >
                {actionLoading === "start" ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "▶️ Start"
                )}
              </button>
              <button
                onClick={onStop}
                disabled={
                  actionLoading !== null || server.status === "stopped"
                }
                className="btn btn-sm btn-error"
              >
                {actionLoading === "stop" ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "⏹️ Stop"
                )}
              </button>
              <button
                onClick={onRestart}
                disabled={actionLoading !== null}
                className="btn btn-sm btn-warning"
              >
                {actionLoading === "restart" ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "🔄 Restart"
                )}
              </button>
            </div>
          )}

          {/* Start Script Viewer Button - Only show for native/cluster servers */}
          {(server.type === "native" || server.type === "cluster-server") && (
            <button
              onClick={onShowStartScript}
              className="btn btn-sm btn-outline btn-info ml-2"
            >
              📜 View Start Script
            </button>
          )}

          {/* Update Server Button */}
          <button
            onClick={onShowUpdateManager}
            className="btn btn-sm btn-outline btn-accent ml-2"
          >
            🔄 Update Server
          </button>

          {/* Settings Button */}
          {supportsCapability("canEditConfig") && (
            <button
              onClick={onShowSettingsEditor}
              className="btn btn-sm btn-outline btn-primary ml-2"
            >
              ⚙️ Settings
            </button>
          )}

          {/* Backup Button */}
          {supportsCapability("canBackup") && (
            <button
              onClick={onOpenBackupModal}
              className="btn btn-sm btn-outline btn-secondary ml-2"
            >
              🗄️ Backup
            </button>
          )}

          {/* Restore Button */}
          {supportsCapability("canRestore") && (
            <button
              onClick={onOpenRestoreModal}
              className="btn btn-sm btn-outline btn-warning ml-2"
            >
              ♻️ Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerHeader;
