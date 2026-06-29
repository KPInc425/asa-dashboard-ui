import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../contexts/ToastContext";
import { useConfirm } from "../contexts/ConfirmContext2";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Server } from "../utils/serverUtils";
import { provisioningApi } from "../services";
import { autoUpdateApi } from "../services/api-auto-update";
import {
  useServerDetails,
  useServerLiveDataDynamic,
  useRefetchServers,
} from "../hooks/useServerData";
import { useServerCommand } from "../hooks/useServerCommand";
import { useEnvironment } from "../contexts/EnvironmentContext";
import ServerModManager from "../components/ServerModManager";
import ServerConfigEditor from "../components/ServerConfigEditor";
import ServerLogViewer from "../components/ServerLogViewer";
import StartScriptViewer from "../components/StartScriptViewer";
import ServerUpdateManager from "../components/ServerUpdateManager";
import ServerSettingsEditor from "../components/ServerSettingsEditor";
import SaveFileManager from "../components/SaveFileManager";
import ServerDetailsRconConsole from "../components/ServerDetailsRconConsole";
import LoadingState from "./server-details/LoadingState";
import ErrorState from "./server-details/ErrorState";
import DeepLinkOnlyView from "./server-details/DeepLinkOnlyView";
import ServerHeader from "./server-details/ServerHeader";
import TabNavigation from "./server-details/TabNavigation";
import DetailsTabPanel from "./server-details/DetailsTabPanel";
import ServerBackupModal from "./server-details/ServerBackupModal";
import ServerRestoreModal from "./server-details/ServerRestoreModal";

const ServerDetails: React.FC = () => {
  const { serverName } = useParams<{ serverName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "details" | "rcon" | "config" | "logs" | "mods" | "saves"
  >("details");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStartScript, setShowStartScript] = useState(false);
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  const [configSectionExpanded, setConfigSectionExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backup/Restore state
  const [serverBackups, setServerBackups] = useState<
    Array<{ name: string; backupDate?: string; serverName: string }>
  >([]);
  const [serverBackupLoading, setServerBackupLoading] = useState(false);
  const [serverBackupError, setServerBackupError] = useState<string>("");
  const [downloadServerBackupLoading, setDownloadServerBackupLoading] =
    useState<string>("");
  const [showServerBackupModal, setShowServerBackupModal] = useState(false);
  const [showServerRestoreModal, setShowServerRestoreModal] = useState(false);
  const [serverRestoreFile, setServerRestoreFile] = useState<File | null>(null);
  const [serverRestoreLoading, setServerRestoreLoading] = useState(false);
  const [serverRestoreError, setServerRestoreError] = useState<string>("");
  const [serverRestoreSuccess, setServerRestoreSuccess] = useState<string>("");

  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const { currentEnvironment, supportsCapability } = useEnvironment();

  // Use centralized hooks for server data and mutations
  const {
    data: serverData,
    isLoading: loading,
    error: queryError,
    refetch: refetchServer,
  } = useServerDetails(serverName);

  // Use dynamic polling for live data with transition tracking
  const {
    data: liveData,
    transitionTracker,
    isTransitioning,
    isRefetching,
  } = useServerLiveDataDynamic(
    serverName,
    serverData?.type === "container" ? "container" : "native",
  );

  const autoUpdateStatusQuery = useQuery({
    queryKey: ["auto-update", "server-status", serverName],
    queryFn: () => autoUpdateApi.getStatus(serverName!),
    enabled: !!serverName,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const { refetchServer: invalidateServer } = useRefetchServers();

  // Convert to Server type for backward compatibility
  const server: Server | null = serverData
    ? {
        ...serverData,
        status: (liveData?.status || serverData.status) as Server["status"],
        type: serverData.type as Server["type"],
      }
    : null;

  // Server command mutations with optimistic updates
  const { startMutation, safeStopMutation, safeRestartMutation } =
    useServerCommand({
      onSuccess: (action, serverId) => {
        console.log(`✅ ${action} completed for ${serverId}`);
        refetchServer();
        invalidateServer(serverId);
      },
      onError: (action, _serverId, err) => {
        setError(`Failed to ${action} server: ${err.message}`);
      },
    });

  // Handle query error
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load server");
    }
  }, [queryError]);

  // Handle tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["details", "rcon", "config", "logs", "mods", "saves"].includes(tabParam)
    ) {
      setActiveTab(
        tabParam as "details" | "rcon" | "config" | "logs" | "mods" | "saves",
      );
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (
    tab: "details" | "rcon" | "config" | "logs" | "mods" | "saves",
  ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Server control actions using mutations
  const handleServerAction = async (action: "start" | "stop" | "restart") => {
    if (!server || !serverName) return;

    setActionLoading(action);
    setError(null);

    try {
      const serverType = server.type === "container" ? "container" : "native";

      console.log(
        `🔄 Attempting to ${action} server: ${server.name} (type: ${server.type})`,
      );

      if (action === "start") {
        await startMutation.mutateAsync({ serverId: serverName, serverType });
      } else if (action === "stop") {
        await safeStopMutation.mutateAsync({
          serverId: serverName,
          serverType,
        });
      } else if (action === "restart") {
        await safeRestartMutation.mutateAsync({
          serverId: serverName,
          serverType,
        });
      }

      // Note: refetch is handled by onSuccess callback in useServerCommand
    } catch (err: unknown) {
      console.error(`Failed to ${action} server:`, err);
      // Error is handled by mutation onError
    } finally {
      setActionLoading(null);
    }
  };

  // Confirmation handlers for destructive actions
  const handleStopWithConfirmation = async () => {
    if (!server) return;
    const proceed = await showConfirm(
      `Are you sure you want to stop the server "${server.name}"? This will disconnect all players.`,
    );
    if (proceed) await handleServerAction("stop");
  };

  const handleRestartWithConfirmation = async () => {
    if (!server) return;
    const proceed = await showConfirm(
      `Are you sure you want to restart the server "${server.name}"? This will disconnect all players and restart the server.`,
    );
    if (proceed) await handleServerAction("restart");
  };

  // Server backup modal handlers
  const openServerBackupModal = async () => {
    if (!serverName) return;
    setShowServerBackupModal(true);
    setServerBackupLoading(true);
    setServerBackupError("");
    try {
      const result = await provisioningApi.listServerBackups();
      if (result.success) {
        const filtered = ((result.data?.backups as any[]) || []).filter(
          (b: any) => b.serverName === serverName,
        );
        setServerBackups(filtered);
      } else {
        setServerBackupError(result.message || "Failed to load backups");
      }
    } catch (err: unknown) {
      setServerBackupError(
        err instanceof Error ? err.message : "Failed to load backups",
      );
    } finally {
      setServerBackupLoading(false);
    }
  };

  const handleDownloadServerBackup = async (backupName: string) => {
    if (!serverName) return;
    setDownloadServerBackupLoading(backupName);
    try {
      const blob = await provisioningApi.downloadServerBackup(
        serverName,
        backupName,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backupName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Failed to download server backup:", err);
      try {
        showToast("Failed to download server backup", "error");
      } catch {
        /* noop */
      }
    } finally {
      setDownloadServerBackupLoading("");
    }
  };

  const handleDeleteServerBackup = async (backupName: string) => {
    if (!serverName) return;
    const proceed = await showConfirm(
      `Are you sure you want to delete backup "${backupName}"? This action cannot be undone.`,
    );
    if (!proceed) return;

    try {
      const response = await provisioningApi.deleteServerBackup(
        serverName,
        backupName,
      );
      if (response.success) {
        setServerBackups((prev) => prev.filter((b) => b.name !== backupName));
      } else {
        try {
          showToast(`Failed to delete backup: ${response.message}`, "error");
        } catch {}
      }
    } catch (err: unknown) {
      console.error("Failed to delete backup:", err);
      try {
        showToast("Failed to delete backup", "error");
      } catch {}
    }
  };

  // Server restore modal handlers
  const openServerRestoreModal = () => {
    setShowServerRestoreModal(true);
    setServerRestoreFile(null);
    setServerRestoreError("");
    setServerRestoreSuccess("");
  };

  const handleServerRestoreFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setServerRestoreFile(e.target.files?.[0] || null);
    setServerRestoreError("");
    setServerRestoreSuccess("");
  };

  const handleServerRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName || !serverRestoreFile) {
      setServerRestoreError("Please select a backup ZIP file");
      return;
    }
    setServerRestoreLoading(true);
    setServerRestoreError("");
    setServerRestoreSuccess("");
    try {
      const result = await provisioningApi.restoreServerBackup(
        serverRestoreFile,
        serverName,
      );
      if (result.success) {
        setServerRestoreSuccess(
          result.message || "Server restored successfully",
        );
      } else {
        setServerRestoreError(result.message || "Failed to restore server");
      }
    } catch (err: unknown) {
      setServerRestoreError(
        err instanceof Error ? err.message : "Failed to restore server",
      );
    } finally {
      setServerRestoreLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  // Deep-link-only mode: no backend configured
  if (currentEnvironment.backends.length === 0) {
    return (
      <DeepLinkOnlyView
        serverName={serverName}
        currentEnvironment={currentEnvironment}
      />
    );
  }

  if (error || !server) {
    return <ErrorState error={error} onBack={() => navigate("/servers")} />;
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <ServerHeader
          server={server}
          actionLoading={actionLoading}
          autoUpdateStatusQuery={autoUpdateStatusQuery}
          supportsCapability={supportsCapability}
          onNavigateBack={() => navigate("/servers")}
          onStart={() => handleServerAction("start")}
          onStop={handleStopWithConfirmation}
          onRestart={handleRestartWithConfirmation}
          onShowStartScript={() => setShowStartScript(true)}
          onShowUpdateManager={() => setShowUpdateManager(true)}
          onShowSettingsEditor={() => setShowSettingsEditor(true)}
          onOpenBackupModal={openServerBackupModal}
          onOpenRestoreModal={openServerRestoreModal}
        />

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          supportsCapability={supportsCapability}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-sm flex-1">
          <div className="card-body">
            {activeTab === "details" && (
              <DetailsTabPanel
                server={server}
                liveData={liveData}
                isTransitioning={isTransitioning}
                isRefetching={isRefetching}
                transitionTracker={transitionTracker}
                autoUpdateStatusQuery={autoUpdateStatusQuery}
                configSectionExpanded={configSectionExpanded}
                onToggleConfigSection={() =>
                  setConfigSectionExpanded(!configSectionExpanded)
                }
                onShowToast={showToast}
              />
            )}

            {activeTab === "rcon" && (
              <ServerDetailsRconConsole serverName={server.name} />
            )}

            {activeTab === "mods" && (
              <ServerModManager
                serverName={server.name}
                onClose={() => setActiveTab("details")}
              />
            )}

            {activeTab === "config" && (
              <ServerConfigEditor serverName={server.name} />
            )}

            {activeTab === "logs" && (
              <ServerLogViewer serverName={serverName} />
            )}

            {activeTab === "saves" && server && (
              <SaveFileManager serverName={server.name} />
            )}
          </div>
        </div>
      </div>

      {/* Start Script Viewer Modal */}
      {showStartScript && server && (
        <StartScriptViewer
          serverName={server.name}
          onClose={() => setShowStartScript(false)}
        />
      )}

      {/* Server Update Manager Modal */}
      {showUpdateManager && (
        <ServerUpdateManager onClose={() => setShowUpdateManager(false)} />
      )}

      {/* Server Settings Editor Modal */}
      {showSettingsEditor && server && (
        <ServerSettingsEditor
          server={server}
          onClose={() => setShowSettingsEditor(false)}
          onSave={() => {
            refetchServer();
          }}
        />
      )}

      {/* Server Backup Modal */}
      {showServerBackupModal && (
        <ServerBackupModal
          serverName={serverName || ""}
          loading={serverBackupLoading}
          error={serverBackupError}
          backups={serverBackups}
          downloadLoading={downloadServerBackupLoading}
          onDownload={handleDownloadServerBackup}
          onDelete={handleDeleteServerBackup}
          onClose={() => setShowServerBackupModal(false)}
        />
      )}

      {/* Server Restore Modal */}
      {showServerRestoreModal && (
        <ServerRestoreModal
          serverName={serverName || ""}
          loading={serverRestoreLoading}
          error={serverRestoreError}
          success={serverRestoreSuccess}
          onFileChange={handleServerRestoreFileChange}
          onSubmit={handleServerRestoreSubmit}
          onClose={() => setShowServerRestoreModal(false)}
        />
      )}
    </div>
  );
};

export default ServerDetails;
