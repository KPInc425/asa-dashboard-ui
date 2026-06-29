import React from "react";
import type { Server } from "../../utils/serverUtils";
import { getMapDisplayName } from "../../config/maps";
import { getTypeLabel, getStatusColor, getUpdateStatusBadge } from "./helpers";
import TransitionProgress from "../../components/TransitionProgress";
import ServerLiveDetails from "../../components/ServerLiveDetails";

interface DetailsTabPanelProps {
  server: Server;
  liveData: { status?: string } | undefined;
  isTransitioning: boolean;
  isRefetching: boolean;
  transitionTracker: {
    transitionStartedAt?: string;
    expectedDuration?: number;
    previousStatus?: string;
  };
  autoUpdateStatusQuery: { data: unknown };
  configSectionExpanded: boolean;
  onToggleConfigSection: () => void;
  onShowToast: (message: string, type: "warning" | "error" | "info" | "success") => void;
}

const DetailsTabPanel: React.FC<DetailsTabPanelProps> = ({
  server,
  liveData,
  isTransitioning,
  isRefetching,
  transitionTracker,
  autoUpdateStatusQuery,
  configSectionExpanded,
  onToggleConfigSection,
  onShowToast,
}) => {
  const autoUpdateData = autoUpdateStatusQuery.data as {
    success?: boolean;
    lastCheck?: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* Transition Progress - Show during server transitions */}
      {isTransitioning && (
        <TransitionProgress
          status={liveData?.status || server.status}
          transitionStartedAt={transitionTracker.transitionStartedAt}
          expectedDuration={transitionTracker.expectedDuration}
          previousStatus={transitionTracker.previousStatus}
          variant="full"
          onStuck={() => {
            onShowToast(
              "Server transition is taking longer than expected. Check the logs for details.",
              "warning",
            );
          }}
        />
      )}

      {/* Live Server Information - Show when running (and not transitioning) */}
      {server.status === "running" && !isTransitioning && (
        <div className="mb-6">
          <ServerLiveDetails
            serverName={server.name}
            serverType={server.type}
          />
        </div>
      )}

      {/* Refetching indicator */}
      {isRefetching && !isTransitioning && (
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <span className="loading loading-spinner loading-xs"></span>
          <span>Refreshing data...</span>
        </div>
      )}

      {/* Server Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title">Server Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Name:</span>
                <span className="font-medium">{server.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Type:</span>
                <span className="badge badge-outline">
                  {getTypeLabel(server.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Status:</span>
                <span className={`badge ${getStatusColor(server.status)}`}>
                  {server.status.charAt(0).toUpperCase() +
                    server.status.slice(1)}
                </span>
              </div>
              {autoUpdateData?.success && (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/70">
                      Update Status:
                    </span>
                    <span>{getUpdateStatusBadge(autoUpdateStatusQuery)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/70">
                      Last Update Check:
                    </span>
                    <span className="text-right">
                      {autoUpdateData.lastCheck
                        ? new Date(autoUpdateData.lastCheck).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                </>
              )}
              {server.map && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Map:</span>
                  <span>{getMapDisplayName(server.map)}</span>
                </div>
              )}
              {server.clusterName && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Cluster:</span>
                  <span>{server.clusterName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="card-title">Network Information</h4>
            <div className="space-y-2">
              {server.gamePort && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Game Port:</span>
                  <span>{server.gamePort}</span>
                </div>
              )}
              {server.queryPort && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Query Port:</span>
                  <span>{server.queryPort}</span>
                </div>
              )}
              {server.rconPort && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">RCON Port:</span>
                  <span>{server.rconPort}</span>
                </div>
              )}
              {server.maxPlayers && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">Max Players:</span>
                  <span>{server.maxPlayers}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Section - Collapsible */}
      {server.config && (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h4 className="card-title">Configuration</h4>
              <button
                onClick={onToggleConfigSection}
                className="btn btn-sm btn-outline"
              >
                {configSectionExpanded ? "🔽 Collapse" : "▶️ Expand"}
              </button>
            </div>
            {configSectionExpanded && (
              <pre className="text-xs bg-base-300 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(server.config, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsTabPanel;
